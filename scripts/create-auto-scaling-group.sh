#!/bin/bash

# Create Auto Scaling Group for FittedIn
# This script creates an Auto Scaling Group with scaling policies

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
ASG_NAME="${ASG_NAME:-fittedin-asg}"
LAUNCH_TEMPLATE_NAME="${LAUNCH_TEMPLATE_NAME:-fittedin-launch-template}"
MIN_SIZE="${MIN_SIZE:-1}"
MAX_SIZE="${MAX_SIZE:-3}"
DESIRED_CAPACITY="${DESIRED_CAPACITY:-1}"
VPC_ID="${VPC_ID:-}"
SUBNET_IDS="${SUBNET_IDS:-}"
HEALTH_CHECK_TYPE="${HEALTH_CHECK_TYPE:-ELB}"
TARGET_GROUP_ARN="${TARGET_GROUP_ARN:-}"
REGION="${AWS_REGION:-us-east-1}"

echo -e "${GREEN}📈 Creating Auto Scaling Group${NC}"
echo "=========================================="

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed${NC}"
    exit 1
fi

# Validate required parameters
if [ -z "$VPC_ID" ] || [ -z "$SUBNET_IDS" ]; then
    echo -e "${RED}❌ VPC_ID and SUBNET_IDS are required${NC}"
    echo "Usage: VPC_ID=vpc-xxx SUBNET_IDS=subnet-xxx,subnet-yyy ./create-auto-scaling-group.sh"
    exit 1
fi

# Convert subnet IDs to array format for JSON
SUBNET_ARRAY=$(echo "$SUBNET_IDS" | tr ',' '\n' | sed 's/^/"/;s/$/"/' | tr '\n' ',' | sed 's/,$//')
SUBNET_JSON="[$SUBNET_ARRAY]"

echo -e "${GREEN}Creating Auto Scaling Group: $ASG_NAME${NC}"

# Create Auto Scaling Group
aws autoscaling create-auto-scaling-group \
    --auto-scaling-group-name "$ASG_NAME" \
    --launch-template "LaunchTemplateName=$LAUNCH_TEMPLATE_NAME,Version=\$Latest" \
    --min-size $MIN_SIZE \
    --max-size $MAX_SIZE \
    --desired-capacity $DESIRED_CAPACITY \
    --vpc-zone-identifier "$SUBNET_IDS" \
    --health-check-type "$HEALTH_CHECK_TYPE" \
    --health-check-grace-period 300 \
    --target-group-arns $TARGET_GROUP_ARN \
    --tags \
        "Key=Name,Value=FittedIn-ASG,PropagateAtLaunch=true" \
        "Key=Project,Value=FittedIn,PropagateAtLaunch=true" \
        "Key=Environment,Value=production,PropagateAtLaunch=true" \
    --region $REGION || {
    echo -e "${YELLOW}⚠️  Auto Scaling Group may already exist${NC}"
}

# Create scaling policies
echo -e "\n${GREEN}Creating scaling policies...${NC}"

# Scale-up policy (when CPU > 70%)
SCALE_UP_POLICY_ARN=$(aws autoscaling put-scaling-policy \
    --auto-scaling-group-name "$ASG_NAME" \
    --policy-name "FittedIn-ScaleUp" \
    --policy-type "TargetTrackingScaling" \
    --target-tracking-configuration '{
        "PredefinedMetricSpecification": {
            "PredefinedMetricType": "ASGAverageCPUUtilization"
        },
        "TargetValue": 70.0,
        "ScaleInCooldown": 300,
        "ScaleOutCooldown": 60
    }' \
    --region $REGION \
    --query 'PolicyARN' \
    --output text)

echo -e "${GREEN}✅ Scale-up policy created: $SCALE_UP_POLICY_ARN${NC}"

# Create CloudWatch alarms for scaling
echo -e "\n${GREEN}Creating CloudWatch alarms for scaling...${NC}"

# High CPU alarm (triggers scale-up)
aws cloudwatch put-metric-alarm \
    --alarm-name "FittedIn-ASG-HighCPU" \
    --alarm-description "Trigger scale-up when CPU > 70%" \
    --metric-name CPUUtilization \
    --namespace AWS/EC2 \
    --statistic Average \
    --period 300 \
    --evaluation-periods 2 \
    --threshold 70 \
    --comparison-operator GreaterThanThreshold \
    --dimensions Name=AutoScalingGroupName,Value=$ASG_NAME \
    --alarm-actions "$SCALE_UP_POLICY_ARN" \
    --region $REGION || echo -e "${YELLOW}⚠️  Alarm may already exist${NC}"

echo -e "\n${GREEN}✅ Auto Scaling Group setup completed!${NC}"
echo "=========================================="
echo -e "Auto Scaling Group: $ASG_NAME"
echo -e "Min instances: $MIN_SIZE"
echo -e "Max instances: $MAX_SIZE"
echo -e "Desired capacity: $DESIRED_CAPACITY"
echo ""
echo -e "View in AWS Console:"
echo "https://console.aws.amazon.com/ec2autoscaling/home?region=$REGION#/details/$ASG_NAME"

