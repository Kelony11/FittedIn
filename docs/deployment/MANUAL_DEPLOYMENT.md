# Manual EC2 Deployment Guide

This guide explains how to deploy FittedIn to EC2 using the `setup.sh` script manually, without GitHub Actions.

## Overview

GitHub Actions has been **disabled** for deployment. Instead, you can use the `setup.sh` script which automatically detects whether it's running in a local development environment or on an EC2 production server.

## Prerequisites

- AWS EC2 instance running Ubuntu 22.04 LTS (or similar)
- SSH access to your EC2 instance
- Domain name (optional but recommended)
- AWS RDS PostgreSQL database (or local PostgreSQL)

## Quick Start

### Step 1: Connect to Your EC2 Instance

```bash
# Change permissions on your key file
chmod 400 your-key.pem

# Connect via SSH
ssh -i your-key.pem ubuntu@your-ec2-ip
```

### Step 2: Clone the Repository

```bash
# Create project directory
sudo mkdir -p /var/www/fittedin
cd /var/www/fittedin

# Clone the repository
sudo git clone https://github.com/zhihungchen/FittedIn.git .
sudo chown -R $USER:$USER /var/www/fittedin
cd /var/www/fittedin
```

### Step 3: Configure Environment Variables

```bash
cd backend

# Copy production environment template
cp env.production.example .env

# Edit environment variables
nano .env
```

Update the following in `.env`:
- `DATABASE_URL` or database connection variables (pointing to your RDS instance)
- `JWT_SECRET` (generate: `openssl rand -base64 32`)
- `CORS_ORIGINS` (your domain or EC2 IP)
- `NODE_ENV=production`

### Step 4: Run Setup Script

```bash
# Make script executable
chmod +x setup.sh

# Run setup script (it will detect EC2 environment automatically)
sudo ./setup.sh
```

The script will:
- ✅ Install Node.js 20.x (if not installed)
- ✅ Install PM2 (if not installed)
- ✅ Install Nginx (if not installed)
- ✅ Install Git (if not installed)
- ✅ Clone/update the repository
- ✅ Install backend dependencies
- ✅ Run database migrations
- ✅ Install frontend dependencies
- ✅ Start application with PM2
- ✅ Configure Nginx
- ✅ Set proper permissions

### Step 5: Configure Nginx (if needed)

If you have a domain name, update the Nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/fittedin
```

Replace `yourdomain.com` with your actual domain, then:

```bash
# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Step 6: Set Up SSL (Optional but Recommended)

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## Updating the Application

To update the application after making changes:

```bash
cd /var/www/fittedin

# Pull latest changes
git pull origin main

# Run setup script again (it will update everything)
sudo ./setup.sh
```

Or manually:

```bash
cd /var/www/fittedin
git pull origin main

cd backend
npm install --production
npm run db:migrate

# Restart with PM2
pm2 restart fittedin-backend
```

## Useful Commands

### Application Management

```bash
# View application status
pm2 status

# View logs
pm2 logs fittedin-backend

# Restart application
pm2 restart fittedin-backend

# Stop application
pm2 stop fittedin-backend

# Monitor resources
pm2 monit
```

### Nginx Management

```bash
# Test configuration
sudo nginx -t

# Reload configuration
sudo systemctl reload nginx

# Restart Nginx
sudo systemctl restart nginx

# View logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Database

```bash
# Run migrations
cd /var/www/fittedin/backend
npm run db:migrate

# Backup database
/var/www/fittedin/scripts/backup-database.sh
```

## Troubleshooting

### Application Not Starting

```bash
# Check PM2 status
pm2 status

# View error logs
pm2 logs fittedin-backend --err

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

# Verify security groups allow EC2 to access RDS
```

### Nginx Issues

```bash
# Test configuration
sudo nginx -t

# Check error logs
sudo tail -f /var/log/nginx/error.log

# Reload configuration
sudo systemctl reload nginx
```

## GitHub Actions Status

GitHub Actions workflows have been **disabled** by renaming the workflow files:
- `.github/workflows/deploy.yml` → `.github/workflows/deploy.yml.disabled`
- `.github/workflows/test.yml` → `.github/workflows/test.yml.disabled`

To re-enable GitHub Actions in the future:
```bash
cd /Users/andrew/projects/FittedIn
mv .github/workflows/deploy.yml.disabled .github/workflows/deploy.yml
mv .github/workflows/test.yml.disabled .github/workflows/test.yml
```

## Differences from GitHub Actions Deployment

| Feature | GitHub Actions | Manual (setup.sh) |
|---------|---------------|-------------------|
| Trigger | Automatic on push | Manual execution |
| Testing | Runs tests before deploy | No automatic tests |
| SSH Setup | Handled by Actions | Manual SSH connection |
| Updates | Automatic | Manual `git pull` + `setup.sh` |
| Monitoring | GitHub Actions logs | PM2 logs, Nginx logs |

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

## Next Steps

After deployment:

1. ✅ Set up domain DNS (if using domain)
2. ✅ Configure SSL certificate
3. ✅ Set up monitoring alerts (CloudWatch)
4. ✅ Configure automated backups
5. ✅ Load testing
6. ✅ Security audit

## Additional Resources

- [AWS EC2 Deployment Guide](./AWS_EC2_DEPLOYMENT.md) - Detailed EC2 setup
- [AWS RDS Setup Guide](./AWS_RDS_SETUP.md) - Database setup
- [SSL Setup Guide](./SSL_SETUP.md) - SSL certificate setup
- [Monitoring and Alerting Guide](./MONITORING_AND_ALERTING.md) - Monitoring setup

