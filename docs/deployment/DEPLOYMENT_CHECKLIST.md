# AWS EC2 Deployment Checklist

Use this checklist to ensure all components are properly configured before and after deployment.

## Pre-Deployment Checklist

### Infrastructure Setup
- [ ] AWS EC2 instance launched and configured
- [ ] Security groups configured (SSH, HTTP, HTTPS)
- [ ] Elastic IP assigned (if using static IP)
- [ ] Domain name DNS configured (A record pointing to EC2)
- [ ] AWS RDS instance created (or local PostgreSQL configured)
- [ ] RDS security group allows EC2 access

### Server Configuration
- [ ] Node.js 20.x installed
- [ ] PM2 installed globally
- [ ] Nginx installed and running
- [ ] PostgreSQL client installed (for backups)
- [ ] AWS CLI installed (optional, for CloudWatch)

### Application Setup
- [ ] Repository cloned to `/var/www/fittedin`
- [ ] Environment variables configured (`.env` file)
- [ ] Database connection tested
- [ ] Dependencies installed (`npm install --production`)
- [ ] Database migrations run (`npm run db:migrate`)

### Security Configuration
- [ ] Strong JWT secret generated
- [ ] Database passwords are secure
- [ ] CORS origins configured correctly
- [ ] Environment variables not exposed in code
- [ ] SSH key-based authentication only
- [ ] Firewall (UFW) configured (optional)

## Deployment Steps

### 1. Initial Deployment
- [ ] Run deployment script: `sudo ./scripts/deploy.sh`
- [ ] Or manually:
  - [ ] Start with PM2: `pm2 start ecosystem.config.js --env production`
  - [ ] Save PM2 config: `pm2 save`
  - [ ] Setup PM2 startup: `pm2 startup systemd`

### 2. Nginx Configuration
- [ ] Nginx config copied to `/etc/nginx/sites-available/fittedin`
- [ ] Domain name updated in Nginx config
- [ ] Symlink created: `/etc/nginx/sites-enabled/fittedin`
- [ ] Nginx config tested: `sudo nginx -t`
- [ ] Nginx reloaded: `sudo systemctl reload nginx`

### 3. SSL Certificate
- [ ] Certbot installed
- [ ] SSL certificate obtained: `sudo certbot --nginx -d yourdomain.com`
- [ ] Auto-renewal configured
- [ ] Certificate verified: `sudo certbot certificates`

### 4. Database Setup
- [ ] RDS endpoint configured in `.env`
- [ ] Database connection tested
- [ ] Migrations completed successfully
- [ ] Backup script tested

## Post-Deployment Verification

### Application Status
- [ ] PM2 shows application running: `pm2 status`
- [ ] Application responds to health check: `curl https://yourdomain.com/api/health`
- [ ] Frontend loads correctly
- [ ] API endpoints working
- [ ] Authentication working (register/login)

### Performance
- [ ] Application starts without errors
- [ ] No memory leaks (check with `pm2 monit`)
- [ ] Response times acceptable
- [ ] Database queries optimized

### Security
- [ ] HTTPS working (no mixed content warnings)
- [ ] SSL certificate valid (check browser)
- [ ] Security headers present (check with browser dev tools)
- [ ] Rate limiting working
- [ ] CORS configured correctly

### Monitoring
- [ ] PM2 logs accessible: `pm2 logs fittedin-backend`
- [ ] Nginx logs accessible: `sudo tail -f /var/log/nginx/fittedin-error.log`
- [ ] CloudWatch logging working (if configured)
- [ ] Monitoring alerts set up (optional)

### Backup
- [ ] Database backup script tested
- [ ] Backup cron job configured (if using)
- [ ] Backup files accessible
- [ ] Backup restoration tested (optional)

## Maintenance Checklist

### Regular Tasks
- [ ] Monitor application logs weekly
- [ ] Check disk space: `df -h`
- [ ] Review security updates: `sudo apt-get update`
- [ ] Verify SSL certificate renewal: `sudo certbot renew --dry-run`
- [ ] Test database backups
- [ ] Review CloudWatch metrics (if configured)

### Update Procedure
- [ ] Pull latest code: `git pull origin main`
- [ ] Install dependencies: `npm install --production`
- [ ] Run migrations: `npm run db:migrate`
- [ ] Restart application: `pm2 restart fittedin-backend`
- [ ] Verify application working
- [ ] Check logs for errors

## Troubleshooting Checklist

If issues occur, check:

- [ ] PM2 status: `pm2 status`
- [ ] Application logs: `pm2 logs fittedin-backend`
- [ ] Nginx status: `sudo systemctl status nginx`
- [ ] Nginx logs: `sudo tail -f /var/log/nginx/error.log`
- [ ] Database connection: Test with `psql`
- [ ] Environment variables: `cat backend/.env`
- [ ] Port availability: `sudo lsof -i :3000`
- [ ] Disk space: `df -h`
- [ ] Memory usage: `free -h`
- [ ] SSL certificate: `sudo certbot certificates`

## Quick Commands Reference

```bash
# Application
pm2 status
pm2 restart fittedin-backend
pm2 logs fittedin-backend
pm2 monit

# Nginx
sudo nginx -t
sudo systemctl reload nginx
sudo tail -f /var/log/nginx/error.log

# Database
npm run db:migrate
./scripts/backup-database.sh

# SSL
sudo certbot renew
sudo certbot certificates

# System
df -h
free -h
sudo apt-get update && sudo apt-get upgrade
```

## Emergency Contacts

- AWS Support: [AWS Support Center](https://console.aws.amazon.com/support/)
- Domain Registrar: [Your registrar support]
- Team Lead: [Contact information]

---

**Last Updated**: 2024
**Maintained By**: FittedIn Development Team

