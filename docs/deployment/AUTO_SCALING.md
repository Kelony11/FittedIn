# Auto Scaling Configuration Guide

Complete guide for setting up EC2 Auto Scaling for FittedIn to handle variable traffic loads.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Launch Template Setup](#launch-template-setup)
- [Auto Scaling Group Configuration](#auto-scaling-group-configuration)
- [Scaling Policies](#scaling-policies)
- [Load Balancer Integration](#load-balancer-integration)
- [Health Checks](#health-checks)
- [Cost Optimization](#cost-optimization)
- [Troubleshooting](#troubleshooting)

---

## Overview

This guide covers setting up Auto Scaling for FittedIn with:
- ✅ Launch template for consistent instances
- ✅ Auto Scaling Group with min/max/desired capacity
- ✅ Scaling policies based on metrics
- ✅ Load balancer integration
- ✅ Health checks and instance replacement

**Architecture:**
```
Internet → Load Balancer → Auto Scaling Group → EC2 Instances → Application
                                    ↓
                            CloudWatch Metrics
                                    ↓
                            Scaling Policies
```

---

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **VPC and Subnets** configured
3. **Security Groups** set up
4. **IAM Role** for EC2 instances
5. **Application Load Balancer** (recommended)

---

## Launch Template Setup

### Step 1: Create Launch Template

Use the provided script:

```bash
# Set required variables
export KEY_NAME=your-key-pair-name
export SECURITY_GROUP_ID=sg-xxxxxxxxxxxxx
export IAM_ROLE_ARN=arn:aws:iam::123456789012:instance-profile/FittedIn-Role
export AWS_REGION=us-east-1

# Run script
./scripts/create-launch-template.sh
```

### Step 2: Manual Creation (Alternative)

```bash
aws ec2 create-launch-template \
    --launch-template-name fittedin-launch-template \
    --launch-template-data '{
        "ImageId": "ami-xxxxxxxxxxxxx",
        "InstanceType": "t3.small",
        "KeyName": "your-key-pair",
        "SecurityGroupIds": ["sg-xxxxxxxxxxxxx"],
        "IamInstanceProfile": {
            "Arn": "arn:aws:iam::123456789012:instance-profile/FittedIn-Role"
        },
        "UserData": "'$(base64 -w 0 user-data.sh)'",
        "TagSpecifications": [{
            "ResourceType": "instance",
            "Tags": [
                {"Key": "Name", "Value": "FittedIn-AutoScaling"},
                {"Key": "Project", "Value": "FittedIn"}
            ]
        }]
    }'
```

### Step 3: Verify Launch Template

```bash
aws ec2 describe-launch-templates \
    --launch-template-names fittedin-launch-template
```

---

## Auto Scaling Group Configuration

### Step 1: Create Auto Scaling Group

Use the provided script:

```bash
# Set required variables
export VPC_ID=vpc-xxxxxxxxxxxxx
export SUBNET_IDS=subnet-xxx,subnet-yyy
export LAUNCH_TEMPLATE_NAME=fittedin-launch-template
export MIN_SIZE=1
export MAX_SIZE=3
export DESIRED_CAPACITY=1
export AWS_REGION=us-east-1

# Run script
./scripts/create-auto-scaling-group.sh
```

### Step 2: Manual Creation (Alternative)

```bash
aws autoscaling create-auto-scaling-group \
    --auto-scaling-group-name fittedin-asg \
    --launch-template "LaunchTemplateName=fittedin-launch-template,Version=\$Latest" \
    --min-size 1 \
    --max-size 3 \
    --desired-capacity 1 \
    --vpc-zone-identifier "subnet-xxx,subnet-yyy" \
    --health-check-type ELB \
    --health-check-grace-period 300 \
    --target-group-arns "arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/fittedin-tg/xxx"
```

### Step 3: Verify Auto Scaling Group

```bash
aws autoscaling describe-auto-scaling-groups \
    --auto-scaling-group-names fittedin-asg
```

---

## Scaling Policies

### Target Tracking Scaling (Recommended)

Automatically scales based on a target metric value:

```bash
aws autoscaling put-scaling-policy \
    --auto-scaling-group-name fittedin-asg \
    --policy-name FittedIn-TargetTracking \
    --policy-type TargetTrackingScaling \
    --target-tracking-configuration '{
        "PredefinedMetricSpecification": {
            "PredefinedMetricType": "ASGAverageCPUUtilization"
        },
        "TargetValue": 70.0,
        "ScaleInCooldown": 300,
        "ScaleOutCooldown": 60
    }'
```

### Step Scaling

Scale based on CloudWatch alarms:

```bash
# Scale-up policy
aws autoscaling put-scaling-policy \
    --auto-scaling-group-name fittedin-asg \
    --policy-name FittedIn-ScaleUp \
    --adjustment-type ChangeInCapacity \
    --scaling-adjustment 1 \
    --cooldown 300

# Scale-down policy
aws autoscaling put-scaling-policy \
    --auto-scaling-group-name fittedin-asg \
    --policy-name FittedIn-ScaleDown \
    --adjustment-type ChangeInCapacity \
    --scaling-adjustment -1 \
    --cooldown 300
```

### Scheduled Scaling

Scale at specific times:

```bash
# Scale up during business hours
aws autoscaling put-scheduled-update-group-action \
    --auto-scaling-group-name fittedin-asg \
    --scheduled-action-name ScaleUp-BusinessHours \
    --min-size 2 \
    --max-size 4 \
    --desired-capacity 2 \
    --recurrence "0 9 * * *"  # 9 AM daily

# Scale down after hours
aws autoscaling put-scheduled-update-group-action \
    --auto-scaling-group-name fittedin-asg \
    --scheduled-action-name ScaleDown-AfterHours \
    --min-size 1 \
    --max-size 2 \
    --desired-capacity 1 \
    --recurrence "0 22 * * *"  # 10 PM daily
```

---

## Load Balancer Integration

### Step 1: Create Application Load Balancer

```bash
aws elbv2 create-load-balancer \
    --name fittedin-alb \
    --subnets subnet-xxx subnet-yyy \
    --security-groups sg-xxxxxxxxxxxxx \
    --scheme internet-facing \
    --type application
```

### Step 2: Create Target Group

```bash
aws elbv2 create-target-group \
    --name fittedin-tg \
    --protocol HTTP \
    --port 80 \
    --vpc-id vpc-xxxxxxxxxxxxx \
    --health-check-path /api/health \
    --health-check-interval-seconds 30 \
    --healthy-threshold-count 2 \
    --unhealthy-threshold-count 3
```

### Step 3: Attach Target Group to ASG

```bash
aws autoscaling attach-load-balancer-target-groups \
    --auto-scaling-group-name fittedin-asg \
    --target-group-arns "arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/fittedin-tg/xxx"
```

### Step 4: Configure Listener

```bash
aws elbv2 create-listener \
    --load-balancer-arn arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/fittedin-alb/xxx \
    --protocol HTTPS \
    --port 443 \
    --certificates CertificateArn=arn:aws:acm:us-east-1:123456789012:certificate/xxx \
    --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/fittedin-tg/xxx
```

---

## Health Checks

### EC2 Health Checks

Default health check for EC2 instances:

```bash
aws autoscaling update-auto-scaling-group \
    --auto-scaling-group-name fittedin-asg \
    --health-check-type EC2 \
    --health-check-grace-period 300
```

### ELB Health Checks

Health check via Load Balancer:

```bash
aws autoscaling update-auto-scaling-group \
    --auto-scaling-group-name fittedin-asg \
    --health-check-type ELB \
    --health-check-grace-period 300
```

### Custom Health Check Endpoint

Ensure your application has a health check endpoint:

```javascript
// In server.js
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});
```

---

## Cost Optimization

### Instance Types

Choose appropriate instance types:
- **Development**: t3.micro (free tier)
- **Production**: t3.small or t3.medium
- **High Traffic**: t3.large or m5.large

### Scaling Configuration

Optimize scaling to minimize costs:

```bash
# Conservative scaling (cost-optimized)
MIN_SIZE=1
MAX_SIZE=2
DESIRED_CAPACITY=1

# Aggressive scaling (performance-optimized)
MIN_SIZE=2
MAX_SIZE=5
DESIRED_CAPACITY=2
```

### Scheduled Scaling

Scale down during low-traffic periods:

```bash
# Scale down at night
aws autoscaling put-scheduled-update-group-action \
    --auto-scaling-group-name fittedin-asg \
    --scheduled-action-name ScaleDown-Night \
    --min-size 1 \
    --desired-capacity 1 \
    --recurrence "0 2 * * *"  # 2 AM daily
```

### Spot Instances (Advanced)

Use Spot instances for cost savings:

```bash
# In launch template
"InstanceMarketOptions": {
    "MarketType": "spot",
    "SpotOptions": {
        "MaxPrice": "0.05",
        "SpotInstanceType": "one-time"
    }
}
```

---

## Monitoring Auto Scaling

### View Auto Scaling Activity

```bash
aws autoscaling describe-scaling-activities \
    --auto-scaling-group-name fittedin-asg
```

### CloudWatch Metrics

Key metrics to monitor:
- `GroupDesiredCapacity`
- `GroupInServiceInstances`
- `GroupTotalInstances`
- `GroupTerminatingInstances`

### Create Alarms

```bash
# High instance count alarm
aws cloudwatch put-metric-alarm \
    --alarm-name FittedIn-ASG-HighInstanceCount \
    --metric-name GroupTotalInstances \
    --namespace AWS/AutoScaling \
    --statistic Average \
    --period 300 \
    --evaluation-periods 1 \
    --threshold 4 \
    --comparison-operator GreaterThanThreshold \
    --dimensions Name=AutoScalingGroupName,Value=fittedin-asg
```

---

## Troubleshooting

### Instances Not Scaling Up

**Problem**: ASG not creating new instances

**Solutions**:
1. Check if max size allows scaling
2. Verify launch template is valid
3. Check IAM permissions
4. Review CloudWatch metrics
5. Check subnet availability

### Instances Terminating Immediately

**Problem**: New instances terminate right after launch

**Solutions**:
1. Check health check configuration
2. Verify application starts correctly
3. Review user data script
4. Check security group rules
5. Verify target group health checks

### Scaling Too Aggressively

**Problem**: Too many instances created

**Solutions**:
1. Increase cooldown period
2. Adjust target metric value
3. Review scaling policy thresholds
4. Check for metric anomalies

### High Costs

**Problem**: Auto Scaling causing high costs

**Solutions**:
1. Reduce max size
2. Use smaller instance types
3. Implement scheduled scaling
4. Consider Spot instances
5. Review scaling policies

---

## Best Practices

1. ✅ **Start Conservative**
   - Begin with min=1, max=2
   - Monitor and adjust based on traffic

2. ✅ **Use Target Tracking**
   - Simpler than step scaling
   - Automatically adjusts

3. ✅ **Health Checks**
   - Use ELB health checks
   - Set appropriate grace period

4. ✅ **Multiple AZs**
   - Distribute across availability zones
   - Improves availability

5. ✅ **Monitor Costs**
   - Set up billing alarms
   - Review instance usage regularly

---

## Additional Resources

- [EC2 Auto Scaling Documentation](https://docs.aws.amazon.com/autoscaling/ec2/)
- [Application Load Balancer Guide](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/)
- [Auto Scaling Best Practices](https://docs.aws.amazon.com/autoscaling/ec2/userguide/auto-scaling-benefits.html)

---

**Last Updated**: 2024

