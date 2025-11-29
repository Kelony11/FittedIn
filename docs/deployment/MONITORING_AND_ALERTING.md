# Monitoring and Alerting Guide

Complete guide for setting up monitoring, alerting, and dashboards for FittedIn on AWS.

## Table of Contents

- [Overview](#overview)
- [CloudWatch Setup](#cloudwatch-setup)
- [Setting Up Alarms](#setting-up-alarms)
- [Creating Dashboards](#creating-dashboards)
- [Application Metrics](#application-metrics)
- [Log Aggregation](#log-aggregation)
- [Alerting Configuration](#alerting-configuration)
- [Best Practices](#best-practices)

---

## Overview

This guide covers:
- ✅ CloudWatch metrics and alarms
- ✅ Custom application metrics
- ✅ Log aggregation and analysis
- ✅ Alerting via SNS
- ✅ Monitoring dashboards
- ✅ Performance monitoring

**Monitoring Stack:**
```
Application → CloudWatch Logs → CloudWatch Metrics → Alarms → SNS → Notifications
```

---

## CloudWatch Setup

### Prerequisites

1. **AWS CLI configured** with appropriate permissions
2. **IAM Role** with CloudWatch permissions attached to EC2 instance
3. **SNS Topic** for alerting (optional but recommended)

### Required IAM Permissions

Attach the following policy to your EC2 instance role:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cloudwatch:PutMetricData",
        "cloudwatch:GetMetricStatistics",
        "cloudwatch:ListMetrics",
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "logs:DescribeLogStreams"
      ],
      "Resource": "*"
    }
  ]
}
```

### Install CloudWatch Agent (Optional)

For system-level metrics (CPU, memory, disk):

```bash
# Download CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb

# Install
sudo dpkg -i amazon-cloudwatch-agent.deb

# Configure
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
    -a fetch-config \
    -m ec2 \
    -c ssm:AmazonCloudWatch-linux \
    -s
```

---

## Setting Up Alarms

### Automated Setup

Use the provided script to set up common alarms:

```bash
# Set required environment variables
export INSTANCE_ID=i-xxxxxxxxxxxxx
export SNS_TOPIC_ARN=arn:aws:sns:us-east-1:123456789012:fittedin-alerts
export AWS_REGION=us-east-1

# Run setup script
./scripts/setup-cloudwatch-alarms.sh
```

### Manual Setup

#### 1. High CPU Utilization

```bash
aws cloudwatch put-metric-alarm \
    --alarm-name FittedIn-HighCPUUtilization \
    --alarm-description "Alert when CPU exceeds 80%" \
    --metric-name CPUUtilization \
    --namespace AWS/EC2 \
    --statistic Average \
    --period 300 \
    --evaluation-periods 2 \
    --threshold 80 \
    --comparison-operator GreaterThanThreshold \
    --dimensions Name=InstanceId,Value=i-xxxxxxxxxxxxx \
    --alarm-actions arn:aws:sns:us-east-1:123456789012:fittedin-alerts
```

#### 2. High Memory Utilization

```bash
aws cloudwatch put-metric-alarm \
    --alarm-name FittedIn-HighMemoryUtilization \
    --alarm-description "Alert when memory exceeds 85%" \
    --metric-name MemoryUtilization \
    --namespace System/Linux \
    --statistic Average \
    --period 300 \
    --evaluation-periods 2 \
    --threshold 85 \
    --comparison-operator GreaterThanThreshold \
    --dimensions Name=InstanceId,Value=i-xxxxxxxxxxxxx \
    --alarm-actions arn:aws:sns:us-east-1:123456789012:fittedin-alerts
```

#### 3. Low Disk Space

```bash
aws cloudwatch put-metric-alarm \
    --alarm-name FittedIn-LowDiskSpace \
    --alarm-description "Alert when disk space is below 15%" \
    --metric-name DiskSpaceUtilization \
    --namespace CWAgent \
    --statistic Average \
    --period 300 \
    --evaluation-periods 1 \
    --threshold 85 \
    --comparison-operator GreaterThanThreshold \
    --dimensions Name=InstanceId,Value=i-xxxxxxxxxxxxx \
    --alarm-actions arn:aws:sns:us-east-1:123456789012:fittedin-alerts
```

#### 4. Application Health Check

```bash
aws cloudwatch put-metric-alarm \
    --alarm-name FittedIn-HealthCheckFailed \
    --alarm-description "Alert when health check fails" \
    --metric-name HealthCheckStatus \
    --namespace FittedIn/Application \
    --statistic Minimum \
    --period 60 \
    --evaluation-periods 2 \
    --threshold 1 \
    --comparison-operator LessThanThreshold \
    --alarm-actions arn:aws:sns:us-east-1:123456789012:fittedin-alerts
```

---

## Creating Dashboards

### Using AWS Console

1. **Navigate to CloudWatch Dashboards**
   - AWS Console → CloudWatch → Dashboards → Create dashboard

2. **Add Widgets**
   - Click "Add widget"
   - Select metric type (Line, Number, etc.)
   - Choose metrics:
     - `AWS/EC2` → `CPUUtilization`
     - `AWS/EC2` → `NetworkIn/NetworkOut`
     - `System/Linux` → `MemoryUtilization`
     - `FittedIn/Application` → Custom metrics

3. **Save Dashboard**
   - Name: `FittedIn-Production`
   - Set as default if desired

### Using AWS CLI

```bash
# Create dashboard JSON
cat > dashboard.json << 'EOF'
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/EC2", "CPUUtilization", "InstanceId", "i-xxxxxxxxxxxxx"],
          [".", "NetworkIn", ".", "."],
          [".", "NetworkOut", ".", "."]
        ],
        "period": 300,
        "stat": "Average",
        "region": "us-east-1",
        "title": "EC2 Instance Metrics"
      }
    }
  ]
}
EOF

# Create dashboard
aws cloudwatch put-dashboard \
    --dashboard-name FittedIn-Production \
    --dashboard-body file://dashboard.json
```

### Recommended Dashboard Widgets

1. **EC2 Metrics**
   - CPU Utilization
   - Memory Utilization
   - Network In/Out
   - Disk Read/Write

2. **Application Metrics**
   - Request Count
   - Response Time
   - Error Rate
   - Active Connections

3. **Database Metrics** (if using RDS)
   - CPU Utilization
   - Database Connections
   - Read/Write Latency
   - Free Storage Space

4. **Nginx Metrics**
   - Request Rate
   - Error Rate (4xx, 5xx)
   - Response Time

---

## Application Metrics

### Sending Custom Metrics

The application already includes CloudWatch logging. To send custom metrics:

```javascript
// In your application code
const AWS = require('aws-sdk');
const cloudwatch = new AWS.CloudWatch({ region: 'us-east-1' });

// Send custom metric
cloudwatch.putMetricData({
    Namespace: 'FittedIn/Application',
    MetricData: [{
        MetricName: 'RequestCount',
        Value: 1,
        Unit: 'Count',
        Timestamp: new Date()
    }]
}, (err, data) => {
    if (err) console.error('Failed to send metric:', err);
});
```

### Key Metrics to Track

1. **Performance Metrics**
   - Request latency (p50, p95, p99)
   - Request count per endpoint
   - Database query time

2. **Business Metrics**
   - User registrations
   - Active users
   - API usage by endpoint

3. **Error Metrics**
   - Error rate by type
   - Failed authentication attempts
   - Database connection errors

---

## Log Aggregation

### CloudWatch Logs

Logs are automatically sent to CloudWatch via the CloudWatch logger utility.

**View Logs:**
1. AWS Console → CloudWatch → Log groups
2. Select `fittedin-backend`
3. View log streams

**Search Logs:**
```bash
# Using AWS CLI
aws logs filter-log-events \
    --log-group-name fittedin-backend \
    --filter-pattern "ERROR" \
    --start-time $(date -d '1 hour ago' +%s)000
```

### Log Retention

Set log retention policy:

```bash
aws logs put-retention-policy \
    --log-group-name fittedin-backend \
    --retention-in-days 30
```

### Log Insights Queries

Example queries for CloudWatch Logs Insights:

```sql
-- Error rate
fields @timestamp, @message
| filter @message like /ERROR/
| stats count() by bin(5m)

-- Request latency
fields @timestamp, @message
| parse @message "latency:*" as latency
| stats avg(latency), max(latency), min(latency) by bin(5m)

-- Top endpoints
fields @timestamp, @message
| parse @message "endpoint:*" as endpoint
| stats count() by endpoint
| sort count desc
| limit 10
```

---

## Alerting Configuration

### Create SNS Topic

```bash
# Create topic
aws sns create-topic --name fittedin-alerts

# Subscribe email
aws sns subscribe \
    --topic-arn arn:aws:sns:us-east-1:123456789012:fittedin-alerts \
    --protocol email \
    --notification-endpoint your-email@example.com

# Subscribe SMS (optional)
aws sns subscribe \
    --topic-arn arn:aws:sns:us-east-1:123456789012:fittedin-alerts \
    --protocol sms \
    --notification-endpoint +1234567890
```

### Slack Integration (Optional)

1. **Create Slack Webhook**
   - Slack → Apps → Incoming Webhooks
   - Create webhook URL

2. **Create Lambda Function**
   - AWS Lambda → Create function
   - Use SNS trigger
   - Forward to Slack webhook

3. **Subscribe Lambda to SNS**
   ```bash
   aws sns subscribe \
       --topic-arn arn:aws:sns:us-east-1:123456789012:fittedin-alerts \
       --protocol lambda \
       --notification-endpoint arn:aws:lambda:us-east-1:123456789012:function:slack-notifier
   ```

### PagerDuty Integration (Optional)

```bash
# Subscribe PagerDuty to SNS
aws sns subscribe \
    --topic-arn arn:aws:sns:us-east-1:123456789012:fittedin-alerts \
    --protocol https \
    --notification-endpoint https://events.pagerduty.com/integration/xxx/enqueue
```

---

## Best Practices

### 1. Alarm Thresholds

- **CPU**: Alert at 80% (scale up), scale down at 40%
- **Memory**: Alert at 85%
- **Disk**: Alert at 85% (15% free)
- **Error Rate**: Alert if > 1% of requests
- **Response Time**: Alert if p95 > 1 second

### 2. Alarm Evaluation

- Use multiple evaluation periods to avoid false positives
- Set appropriate data points (e.g., 2 out of 3 periods)
- Use different thresholds for different times (e.g., lower at night)

### 3. Log Management

- Set appropriate retention (30 days for production)
- Use log groups for different components
- Enable log encryption
- Monitor log ingestion costs

### 4. Cost Optimization

- Use standard resolution metrics (1-minute) only when needed
- Aggregate metrics at 5-minute intervals when possible
- Set up billing alarms
- Review and archive old logs

### 5. Dashboard Design

- Group related metrics together
- Use appropriate time ranges (1 hour, 6 hours, 24 hours)
- Include both current values and trends
- Add annotations for deployments

---

## Monitoring Checklist

- [ ] CloudWatch alarms configured
- [ ] SNS topic created and subscribed
- [ ] Dashboard created with key metrics
- [ ] Custom application metrics implemented
- [ ] Log retention policy set
- [ ] IAM permissions configured
- [ ] Alerting tested (trigger test alarm)
- [ ] On-call rotation configured (if applicable)
- [ ] Runbook created for common alerts

---

## Troubleshooting

### Alarms Not Triggering

1. Check alarm state: `aws cloudwatch describe-alarms --alarm-names FittedIn-HighCPU`
2. Verify metric data exists
3. Check alarm configuration (threshold, evaluation periods)
4. Verify SNS topic permissions

### Missing Metrics

1. Verify IAM permissions
2. Check CloudWatch agent status
3. Verify custom metrics are being sent
4. Check metric namespace and dimensions

### High CloudWatch Costs

1. Review metric resolution (use standard when possible)
2. Reduce log retention period
3. Filter logs before sending to CloudWatch
4. Use metric math to reduce number of metrics

---

## Additional Resources

- [CloudWatch Documentation](https://docs.aws.amazon.com/cloudwatch/)
- [CloudWatch Logs Insights](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/AnalyzingLogData.html)
- [SNS Documentation](https://docs.aws.amazon.com/sns/)

---

**Last Updated**: 2024

