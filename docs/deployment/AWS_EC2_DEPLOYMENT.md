# AWS EC2 Deployment Guide

Complete guide for deploying FittedIn on AWS EC2 with production-ready configuration.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [EC2 Instance Setup](#ec2-instance-setup)
- [Server Configuration](#server-configuration)
- [Application Deployment](#application-deployment)
- [Database Setup](#database-setup)
- [SSL Configuration](#ssl-configuration)
- [Monitoring & Logging](#monitoring--logging)
- [CI/CD Pipeline](#cicd-pipeline)
- [Auto Scaling](#auto-scaling)
- [Maintenance](#maintenance)
- [Troubleshooting](#troubleshooting)

---

## Overview

This guide covers deploying FittedIn on AWS EC2 with:
- ✅ Node.js backend with PM2 process management
- ✅ Nginx reverse proxy with SSL
- ✅ PostgreSQL database (AWS RDS)
- ✅ Automated backups
- ✅ CloudWatch logging
- ✅ Production-ready security

**Architecture:**
```
Internet
   ↓
AWS EC2 (Nginx + Node.js)
   ↓
AWS RDS (PostgreSQL)
```

---

## Prerequisites

- AWS Account
- Domain name (optional but recommended)
- Basic knowledge of Linux, AWS, and Node.js
- SSH access to EC2 instance

---

## EC2 Instance Setup

### Step 1: Launch EC2 Instance

1. **Navigate to EC2 Console**
   - AWS Console → EC2 → Launch Instance

2. **Choose AMI**
   - **Ubuntu Server 22.04 LTS** (recommended)
   - Or Amazon Linux 2023

3. **Instance Type**
   - **Development**: t2.micro (free tier eligible)
   - **Production**: t3.small or t3.medium

4. **Key Pair**
   - Create new key pair or use existing
   - Download `.pem` file securely

5. **Network Settings**
   - **VPC**: Default or custom
   - **Subnet**: Public subnet
   - **Auto-assign Public IP**: Enable
   - **Security Group**: Create new with rules:
     - SSH (22): Your IP
     - HTTP (80): 0.0.0.0/0
     - HTTPS (443): 0.0.0.0/0

6. **Storage**
   - 20 GB gp3 (minimum)
   - Enable encryption

7. **Launch Instance**

### Step 2: Configure Security Group

Add/Modify rules:

| Type | Protocol | Port | Source | Description |
|------|----------|------|--------|-------------|
| SSH | TCP | 22 | Your IP | SSH access |
| HTTP | TCP | 80 | 0.0.0.0/0 | Web traffic |
| HTTPS | TCP | 443 | 0.0.0.0/0 | Secure web traffic |
| Custom TCP | TCP | 3000 | 127.0.0.1/32 | Node.js (internal only) |

### Step 3: Connect to Instance

```bash
# Change permissions
chmod 400 your-key.pem

# Connect via SSH
ssh -i your-key.pem ubuntu@your-ec2-ip
```

---

## Server Configuration

### Step 1: Update System

```bash
sudo apt-get update
sudo apt-get upgrade -y
```

### Step 2: Install Node.js

```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### Step 3: Install PM2

```bash
sudo npm install -g pm2
```

### Step 4: Install Nginx

```bash
sudo apt-get install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Step 5: Install PostgreSQL Client (for backups)

```bash
sudo apt-get install -y postgresql-client
```

### Step 6: Install AWS CLI (optional, for CloudWatch)

```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

---

## Application Deployment

### Step 1: Clone Repository

```bash
# Create project directory
sudo mkdir -p /var/www
cd /var/www

# Clone repository
sudo git clone https://github.com/yourusername/FittedIn.git
sudo chown -R $USER:$USER /var/www/fittedin
cd /var/www/fittedin
```

### Step 2: Configure Environment Variables

```bash
cd backend

# Copy production environment template
cp env.production.example .env

# Edit environment variables
nano .env
```

Update the following:
- `DATABASE_URL` or database connection variables
- `JWT_SECRET` (generate: `openssl rand -base64 32`)
- `CORS_ORIGINS` (your domain)
- AWS credentials (if using CloudWatch)

### Step 3: Install Dependencies

```bash
# Backend
cd /var/www/fittedin/backend
npm install --production

# Frontend (if needed)
cd /var/www/fittedin/frontend
npm install --production
```

### Step 4: Run Database Migrations

```bash
cd /var/www/fittedin/backend
npm run db:migrate
```

### Step 5: Deploy with Script

```bash
# Make deploy script executable
chmod +x /var/www/fittedin/scripts/deploy.sh

# Run deployment script
sudo /var/www/fittedin/scripts/deploy.sh
```

Or manually:

```bash
# Start with PM2
cd /var/www/fittedin/backend
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 startup
pm2 startup systemd
# Follow the command it outputs
```

### Step 6: Configure Nginx

```bash
# Copy Nginx configuration
sudo cp /var/www/fittedin/nginx/fittedin.conf /etc/nginx/sites-available/fittedin

# Update domain name in config
sudo nano /etc/nginx/sites-available/fittedin
# Replace 'yourdomain.com' with your actual domain

# Create symlink
sudo ln -s /etc/nginx/sites-available/fittedin /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## Database Setup

### Option 1: AWS RDS (Recommended)

Follow the [AWS RDS Setup Guide](./AWS_RDS_SETUP.md) for detailed instructions.

**Quick Steps:**
1. Create RDS PostgreSQL instance
2. Configure security groups
3. Update `.env` with RDS endpoint
4. Run migrations

### Option 2: Local PostgreSQL

```bash
# Install PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
```

```sql
CREATE DATABASE fittedin_prod;
CREATE USER fittedin_user WITH PASSWORD 'secure-password';
GRANT ALL PRIVILEGES ON DATABASE fittedin_prod TO fittedin_user;
\q
```

---

## SSL Configuration

Follow the [SSL Setup Guide](./SSL_SETUP.md) for detailed instructions.

**Quick Steps:**
1. Install Certbot
2. Obtain certificate
3. Configure Nginx
4. Set up auto-renewal

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## Monitoring & Logging

For detailed monitoring setup, see [Monitoring and Alerting Guide](./MONITORING_AND_ALERTING.md).

### PM2 Monitoring

```bash
# View logs
pm2 logs fittedin-backend

# Monitor resources
pm2 monit

# View status
pm2 status

# View detailed info
pm2 show fittedin-backend
```

### CloudWatch Logs

If configured in `.env`:

```bash
# View logs in AWS Console
# CloudWatch → Log groups → fittedin-backend
```

### Application Logs

```bash
# PM2 logs
tail -f ~/.pm2/logs/fittedin-backend-out.log
tail -f ~/.pm2/logs/fittedin-backend-error.log

# Nginx logs
sudo tail -f /var/log/nginx/fittedin-access.log
sudo tail -f /var/log/nginx/fittedin-error.log
```

---

## Maintenance

### Updating Application

```bash
cd /var/www/fittedin

# Pull latest changes
git pull origin main

# Install dependencies
cd backend
npm install --production

# Run migrations
npm run db:migrate

# Restart application
pm2 restart fittedin-backend
```

### Database Backups

```bash
# Manual backup
/var/www/fittedin/scripts/backup-database.sh

# Schedule automatic backups (crontab)
crontab -e
# Add: 0 2 * * * /var/www/fittedin/scripts/backup-database.sh
```

### Updating System

```bash
# Update packages
sudo apt-get update
sudo apt-get upgrade -y

# Restart if needed
sudo reboot
```

---

## Troubleshooting

### Application Not Starting

```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs fittedin-backend

# Check if port is in use
sudo lsof -i :3000

# Restart PM2
pm2 restart fittedin-backend
```

### Database Connection Issues

```bash
# Test database connection
psql -h your-rds-endpoint -U username -d database_name

# Check environment variables
cd /var/www/fittedin/backend
cat .env | grep DB

# Verify security groups
# Ensure RDS security group allows EC2 security group
```

### Nginx Issues

```bash
# Test configuration
sudo nginx -t

# Check error logs
sudo tail -f /var/log/nginx/error.log

# Reload configuration
sudo systemctl reload nginx

# Restart Nginx
sudo systemctl restart nginx
```

### SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Test renewal
sudo certbot renew --dry-run

# View Certbot logs
sudo journalctl -u certbot.timer
```

### High Memory Usage

```bash
# Check memory usage
free -h
pm2 monit

# Restart application
pm2 restart fittedin-backend

# Consider upgrading instance type
```

---

## Security Checklist

- [ ] Security groups configured correctly
- [ ] SSH key-based authentication only
- [ ] Firewall (UFW) configured
- [ ] SSL certificate installed and auto-renewing
- [ ] Strong database passwords
- [ ] JWT secret is secure
- [ ] Environment variables not exposed
- [ ] Regular security updates
- [ ] Database backups configured
- [ ] CloudWatch logging enabled
- [ ] Rate limiting configured
- [ ] CORS properly configured

---

## Cost Estimation

**Monthly Costs (US East, approximate):**

- **EC2 t3.small**: ~$15/month
- **RDS db.t3.small**: ~$30/month
- **Storage (20GB)**: ~$2/month
- **Data Transfer**: ~$5-10/month
- **Total**: ~$50-60/month

**Free Tier (First 12 months):**
- EC2 t2.micro: 750 hours/month free
- RDS db.t2.micro: 750 hours/month free
- **Potential savings**: ~$30/month

---

## Next Steps

After deployment:

1. ✅ Set up domain DNS
2. ✅ Configure SSL certificate
3. ✅ Set up monitoring alerts
4. ✅ Configure automated backups
5. ✅ Set up CI/CD pipeline (optional)
6. ✅ Load testing
7. ✅ Security audit

---

## CI/CD Pipeline

For automated deployments, see [CI/CD Pipeline Guide](./CI_CD_PIPELINE.md).

**Quick Setup:**
1. Configure GitHub Secrets (AWS credentials, EC2 SSH key)
2. Push to `main` branch to trigger deployment
3. Monitor deployment in GitHub Actions

## Auto Scaling

For handling variable traffic loads, see [Auto Scaling Guide](./AUTO_SCALING.md).

**Benefits:**
- Automatically scale up during high traffic
- Scale down during low traffic
- Improve availability and fault tolerance
- Cost optimization

## Additional Resources

- [AWS EC2 Documentation](https://docs.aws.amazon.com/ec2/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [PM2 Documentation](https://pm2.keymetrics.io/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Monitoring and Alerting Guide](./MONITORING_AND_ALERTING.md)
- [CI/CD Pipeline Guide](./CI_CD_PIPELINE.md)
- [Auto Scaling Guide](./AUTO_SCALING.md)

---

## Quick Reference

```bash
# Application management
pm2 start ecosystem.config.js --env production
pm2 restart fittedin-backend
pm2 stop fittedin-backend
pm2 logs fittedin-backend
pm2 monit

# Nginx management
sudo nginx -t
sudo systemctl reload nginx
sudo systemctl restart nginx

# Database
npm run db:migrate
./scripts/backup-database.sh

# SSL
sudo certbot renew
sudo certbot certificates

# Logs
pm2 logs
sudo tail -f /var/log/nginx/error.log
```

