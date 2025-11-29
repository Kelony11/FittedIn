# AWS RDS Setup Guide

This guide explains how to set up and configure AWS RDS PostgreSQL for FittedIn production deployment.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Creating RDS Instance](#creating-rds-instance)
- [Configuring Security Groups](#configuring-security-groups)
- [Connecting to RDS](#connecting-to-rds)
- [Database Migration](#database-migration)
- [Backup Configuration](#backup-configuration)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI configured (optional but recommended)
- EC2 instance already set up
- Basic knowledge of AWS RDS

---

## Creating RDS Instance

### Step 1: Launch RDS Instance

1. **Navigate to RDS Console**
   - Go to AWS Console → RDS → Databases
   - Click "Create database"

2. **Choose Database Configuration**
   - **Engine**: PostgreSQL
   - **Version**: 15.x or 14.x (recommended)
   - **Template**: Production (for production) or Dev/Test (for staging)

3. **Settings**
   - **DB Instance Identifier**: `fittedin-prod-db`
   - **Master Username**: `fittedin_admin` (or your preferred username)
   - **Master Password**: Generate a strong password (save it securely!)

4. **Instance Configuration**
   - **DB Instance Class**: 
     - Development: `db.t3.micro` (free tier eligible)
     - Production: `db.t3.small` or `db.t3.medium` (based on load)
   - **Storage**: 
     - Type: General Purpose SSD (gp3)
     - Allocated Storage: 20 GB (minimum, increase as needed)
     - Enable storage autoscaling (recommended)

5. **Connectivity**
   - **VPC**: Select the same VPC as your EC2 instance
   - **Subnet Group**: Use default or create custom
   - **Public Access**: **No** (for security)
   - **VPC Security Group**: Create new or select existing
   - **Availability Zone**: Select same zone as EC2 (for lower latency)

6. **Database Authentication**
   - **Password authentication** (default)

7. **Additional Configuration**
   - **Initial Database Name**: `fittedin_prod`
   - **Backup Retention**: 7 days (minimum recommended)
   - **Backup Window**: Choose low-traffic time
   - **Enable Encryption**: Yes (recommended)
   - **Enable Enhanced Monitoring**: Yes (optional but recommended)

8. **Create Database**
   - Review settings
   - Click "Create database"
   - Wait 5-10 minutes for instance to be available

---

## Configuring Security Groups

### Step 1: Modify RDS Security Group

1. **Navigate to RDS Instance**
   - Go to your RDS instance → Connectivity & security
   - Click on the Security Group

2. **Add Inbound Rule**
   - **Type**: PostgreSQL
   - **Protocol**: TCP
   - **Port**: 5432
   - **Source**: 
     - For EC2 access: Select the Security Group of your EC2 instance
     - For direct access (not recommended): Your IP address

3. **Save Rules**

### Step 2: Verify EC2 Security Group

Ensure your EC2 instance security group allows outbound connections to RDS:
- **Type**: All traffic (or PostgreSQL)
- **Destination**: RDS Security Group

---

## Connecting to RDS

### Get Connection Details

1. **Find Endpoint**
   - Go to RDS instance → Connectivity & security
   - Copy the **Endpoint** (e.g., `fittedin-prod-db.xxxxx.us-east-1.rds.amazonaws.com`)
   - Note the **Port** (usually 5432)

### Update Environment Variables

Edit your `.env` file on EC2:

```bash
# Option 1: Using DATABASE_URL (Recommended)
DATABASE_URL=postgresql://fittedin_admin:your-password@fittedin-prod-db.xxxxx.us-east-1.rds.amazonaws.com:5432/fittedin_prod

# Option 2: Using individual variables
DB_HOST=fittedin-prod-db.xxxxx.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=fittedin_prod
DB_USER=fittedin_admin
DB_PASSWORD=your-password
```

### Test Connection

From your EC2 instance:

```bash
# Install PostgreSQL client if not already installed
sudo apt-get update
sudo apt-get install -y postgresql-client

# Test connection
psql -h fittedin-prod-db.xxxxx.us-east-1.rds.amazonaws.com \
     -U fittedin_admin \
     -d fittedin_prod
```

---

## Database Migration

### Step 1: Run Migrations

On your EC2 instance:

```bash
cd /var/www/fittedin/backend
npm run db:migrate
```

### Step 2: Verify Tables

Connect to database and verify:

```sql
\dt  -- List all tables
SELECT * FROM users LIMIT 1;  -- Test query
```

---

## Backup Configuration

### Automated Backups

RDS automatically creates backups based on your retention period.

1. **View Backups**
   - RDS Console → Automated backups
   - Shows all automated backups

2. **Manual Snapshot**
   - RDS Console → Snapshots → Take snapshot
   - Useful before major changes

### Using Backup Script

Use the provided backup script:

```bash
# Set environment variables
export DB_HOST=fittedin-prod-db.xxxxx.us-east-1.rds.amazonaws.com
export DB_USER=fittedin_admin
export DB_NAME=fittedin_prod

# Run backup
./scripts/backup-database.sh
```

### Restore from Backup

1. **From Automated Backup**
   - RDS Console → Restore to point in time
   - Select date/time
   - Create new instance

2. **From Snapshot**
   - RDS Console → Snapshots
   - Select snapshot → Restore snapshot

---

## Monitoring

### CloudWatch Metrics

RDS automatically sends metrics to CloudWatch:

- **CPUUtilization**: CPU usage percentage
- **DatabaseConnections**: Number of connections
- **FreeableMemory**: Available memory
- **FreeStorageSpace**: Available storage
- **ReadLatency/WriteLatency**: Database performance

### Set Up Alarms

1. **Navigate to CloudWatch**
   - CloudWatch → Alarms → Create alarm

2. **Common Alarms**
   - **High CPU**: > 80% for 5 minutes
   - **Low Storage**: < 5 GB free
   - **High Connections**: > 80% of max connections

---

## Cost Optimization

### Development/Staging

- Use `db.t3.micro` (free tier eligible for 12 months)
- Disable automated backups (or use 1 day retention)
- Use single-AZ deployment

### Production

- Start with `db.t3.small` and scale up as needed
- Enable Multi-AZ for high availability (increases cost ~2x)
- Use 7+ days backup retention
- Enable storage autoscaling

### Estimated Costs (US East, as of 2024)

- **db.t3.micro**: ~$15/month
- **db.t3.small**: ~$30/month
- **db.t3.medium**: ~$60/month
- **Storage**: ~$0.115/GB/month
- **Backups**: Included in storage cost

---

## Troubleshooting

### Connection Issues

**Problem**: Cannot connect from EC2

**Solutions**:
1. Check Security Group rules (both RDS and EC2)
2. Verify VPC configuration
3. Check network ACLs
4. Verify endpoint and credentials

### Performance Issues

**Problem**: Slow queries

**Solutions**:
1. Check CloudWatch metrics
2. Review slow query log
3. Add database indexes
4. Consider upgrading instance class
5. Enable Performance Insights

### Storage Issues

**Problem**: Running out of storage

**Solutions**:
1. Enable storage autoscaling
2. Manually increase storage
3. Clean up old data
4. Review backup retention

---

## Security Best Practices

1. ✅ **Never expose RDS publicly** (Public Access = No)
2. ✅ **Use strong passwords** (minimum 16 characters)
3. ✅ **Enable encryption at rest**
4. ✅ **Enable encryption in transit** (SSL)
5. ✅ **Use IAM database authentication** (advanced)
6. ✅ **Regularly rotate passwords**
7. ✅ **Limit security group access** (only from EC2)
8. ✅ **Enable CloudWatch logging**
9. ✅ **Regular security updates** (maintenance windows)

---

## Next Steps

After setting up RDS:

1. ✅ Update application `.env` file
2. ✅ Run database migrations
3. ✅ Test application connectivity
4. ✅ Set up monitoring alarms
5. ✅ Configure automated backups
6. ✅ Document connection details securely

---

## Additional Resources

- [AWS RDS Documentation](https://docs.aws.amazon.com/rds/)
- [PostgreSQL on RDS](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_PostgreSQL.html)
- [RDS Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_BestPractices.html)

