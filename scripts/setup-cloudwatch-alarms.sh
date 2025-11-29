#!/bin/bash

# CloudWatch Alarms Setup Script for FittedIn
# This script creates CloudWatch alarms for monitoring the application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
ALARM_NAMESPACE="FittedIn"
INSTANCE_ID="${INSTANCE_ID:-}"
SNS_TOPIC_ARN="${SNS_TOPIC_ARN:-}"
REGION="${AWS_REGION:-us-east-1}"

echo -e "${GREEN}📊 Setting up CloudWatch Alarms${NC}"
echo "=========================================="

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed${NC}"
    echo "Install it with: curl 'https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip' -o 'awscliv2.zip'"
    exit 1
fi

# Check if instance ID is provided
if [ -z "$INSTANCE_ID" ]; then
    echo -e "${YELLOW}⚠️  INSTANCE_ID not set. Attempting to get from metadata...${NC}"
    INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id 2>/dev/null || echo "")
    if [ -z "$INSTANCE_ID" ]; then
        echo -e "${RED}❌ Could not determine instance ID. Please set INSTANCE_ID environment variable${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✅ Using Instance ID: $INSTANCE_ID${NC}"

# Function to create alarm
create_alarm() {
    local alarm_name=$1
    local metric_name=$2
    local namespace=$3
    local threshold=$4
    local comparison=$5
    local evaluation_periods=$6
    local period=$7
    
    echo -e "\n${GREEN}Creating alarm: $alarm_name${NC}"
    
    local alarm_actions=""
    if [ -n "$SNS_TOPIC_ARN" ]; then
        alarm_actions="--alarm-actions $SNS_TOPIC_ARN --ok-actions $SNS_TOPIC_ARN"
    fi
    
    aws cloudwatch put-metric-alarm \
        --alarm-name "$alarm_name" \
        --alarm-description "FittedIn: $alarm_name" \
        --metric-name "$metric_name" \
        --namespace "$namespace" \
        --statistic Average \
        --period $period \
        --evaluation-periods $evaluation_periods \
        --threshold $threshold \
        --comparison-operator $comparison \
        --dimensions Name=InstanceId,Value=$INSTANCE_ID \
        $alarm_actions \
        --region $REGION \
        --treat-missing-data notBreaching || {
        echo -e "${YELLOW}⚠️  Failed to create alarm: $alarm_name (may already exist)${NC}"
    }
}

# EC2 Instance Alarms
echo -e "\n${GREEN}📈 Creating EC2 Instance Alarms...${NC}"

create_alarm "FittedIn-HighCPUUtilization" \
    "CPUUtilization" \
    "AWS/EC2" \
    80 \
    "GreaterThanThreshold" \
    2 \
    300

create_alarm "FittedIn-HighMemoryUtilization" \
    "MemoryUtilization" \
    "System/Linux" \
    85 \
    "GreaterThanThreshold" \
    2 \
    300

create_alarm "FittedIn-LowDiskSpace" \
    "DiskSpaceUtilization" \
    "CWAgent" \
    85 \
    "GreaterThanThreshold" \
    1 \
    300

create_alarm "FittedIn-StatusCheckFailed" \
    "StatusCheckFailed" \
    "AWS/EC2" \
    1 \
    "GreaterThanOrEqualToThreshold" \
    1 \
    60

# Application Health Alarms (if using custom metrics)
echo -e "\n${GREEN}📊 Creating Application Health Alarms...${NC}"

# Note: These require custom metrics to be sent to CloudWatch
# You can use the CloudWatch logger or send custom metrics from your application

# Database Alarms (if using RDS)
if [ -n "$RDS_INSTANCE_ID" ]; then
    echo -e "\n${GREEN}🗄️  Creating RDS Alarms...${NC}"
    
    create_alarm "FittedIn-RDS-HighCPU" \
        "CPUUtilization" \
        "AWS/RDS" \
        80 \
        "GreaterThanThreshold" \
        2 \
        300 \
        "--dimensions Name=DBInstanceIdentifier,Value=$RDS_INSTANCE_ID"
    
    create_alarm "FittedIn-RDS-HighConnections" \
        "DatabaseConnections" \
        "AWS/RDS" \
        80 \
        "GreaterThanThreshold" \
        2 \
        300 \
        "--dimensions Name=DBInstanceIdentifier,Value=$RDS_INSTANCE_ID"
fi

echo -e "\n${GREEN}✅ CloudWatch alarms setup completed!${NC}"
echo "=========================================="
echo -e "View alarms in AWS Console:"
echo "https://console.aws.amazon.com/cloudwatch/home?region=$REGION#alarmsV2:"
echo ""
echo -e "To receive notifications, create an SNS topic and set SNS_TOPIC_ARN:"
echo "aws sns create-topic --name fittedin-alerts"
echo "export SNS_TOPIC_ARN=arn:aws:sns:region:account-id:fittedin-alerts"

