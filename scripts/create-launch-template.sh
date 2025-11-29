#!/bin/bash

# Create EC2 Launch Template for Auto Scaling
# This script creates a launch template that can be used with Auto Scaling Groups

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
TEMPLATE_NAME="${TEMPLATE_NAME:-fittedin-launch-template}"
INSTANCE_TYPE="${INSTANCE_TYPE:-t3.small}"
AMI_ID="${AMI_ID:-}"
KEY_NAME="${KEY_NAME:-}"
SECURITY_GROUP_ID="${SECURITY_GROUP_ID:-}"
IAM_ROLE_ARN="${IAM_ROLE_ARN:-}"
REGION="${AWS_REGION:-us-east-1}"

echo -e "${GREEN}🚀 Creating EC2 Launch Template${NC}"
echo "=========================================="

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed${NC}"
    exit 1
fi

# Get latest Ubuntu AMI if not provided
if [ -z "$AMI_ID" ]; then
    echo -e "${YELLOW}⚠️  AMI_ID not provided. Finding latest Ubuntu 22.04 AMI...${NC}"
    AMI_ID=$(aws ec2 describe-images \
        --owners 099720109477 \
        --filters "Name=name,Values=ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*" \
                  "Name=state,Values=available" \
        --query 'Images | sort_by(@, &CreationDate) | [-1].ImageId' \
        --output text \
        --region $REGION)
    echo -e "${GREEN}✅ Using AMI: $AMI_ID${NC}"
fi

# User data script
USER_DATA=$(cat <<'EOF'
#!/bin/bash
# FittedIn Auto Scaling Instance User Data

# Update system
apt-get update
apt-get upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Install PM2
npm install -g pm2

# Install Nginx
apt-get install -y nginx

# Install PostgreSQL client
apt-get install -y postgresql-client

# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
./aws/install

# Create project directory
mkdir -p /var/www/fittedin
chown ubuntu:ubuntu /var/www/fittedin

# Clone repository (will be done by deployment script or CodeDeploy)
# The actual application deployment should be handled by:
# 1. CodeDeploy
# 2. User data script that pulls from Git
# 3. Or manual deployment after instance launch

# Setup CloudWatch agent (optional)
# wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
# dpkg -i amazon-cloudwatch-agent.deb

echo "Instance initialization completed"
EOF
)

# Base64 encode user data
USER_DATA_B64=$(echo "$USER_DATA" | base64 -w 0)

# Create launch template
echo -e "\n${GREEN}Creating launch template: $TEMPLATE_NAME${NC}"

TEMPLATE_PARAMS=(
    --launch-template-name "$TEMPLATE_NAME"
    --launch-template-data "{
        \"ImageId\": \"$AMI_ID\",
        \"InstanceType\": \"$INSTANCE_TYPE\",
        \"KeyName\": \"$KEY_NAME\",
        \"SecurityGroupIds\": [\"$SECURITY_GROUP_ID\"],
        \"IamInstanceProfile\": {
            \"Arn\": \"$IAM_ROLE_ARN\"
        },
        \"UserData\": \"$USER_DATA_B64\",
        \"TagSpecifications\": [{
            \"ResourceType\": \"instance\",
            \"Tags\": [{
                \"Key\": \"Name\",
                \"Value\": \"FittedIn-AutoScaling\"
            }, {
                \"Key\": \"Project\",
                \"Value\": \"FittedIn\"
            }, {
                \"Key\": \"Environment\",
                \"Value\": \"production\"
            }]
        }],
        \"BlockDeviceMappings\": [{
            \"DeviceName\": \"/dev/sda1\",
            \"Ebs\": {
                \"VolumeSize\": 20,
                \"VolumeType\": \"gp3\",
                \"DeleteOnTermination\": true,
                \"Encrypted\": true
            }
        }]
    }"
)

aws ec2 create-launch-template \
    "${TEMPLATE_PARAMS[@]}" \
    --region $REGION || {
    echo -e "${YELLOW}⚠️  Launch template may already exist. Updating instead...${NC}"
    aws ec2 create-launch-template-version \
        --launch-template-name "$TEMPLATE_NAME" \
        --launch-template-data "$(echo "${TEMPLATE_PARAMS[@]}" | grep -oP '--launch-template-data \K.*')" \
        --region $REGION
}

echo -e "\n${GREEN}✅ Launch template created successfully!${NC}"
echo "=========================================="
echo -e "Template Name: $TEMPLATE_NAME"
echo -e "Next steps:"
echo "1. Create Auto Scaling Group using this template"
echo "2. Configure scaling policies"
echo "3. Set up health checks"

