# Production Deployment Checklist

Use this checklist to verify all configurations are correct before deploying to AWS EC2 Free Tier.

## Pre-Deployment Configuration

### 1. Environment Variables ✅

- [ ] Copy `env.production.example` to `.env`
- [ ] Set `NODE_ENV=production`
- [ ] Set `PORT=3000`
- [ ] Generate strong `JWT_SECRET` (at least 32 characters):
  ```bash
  openssl rand -base64 32
  ```
- [ ] Configure `DATABASE_URL` (for AWS RDS) or individual DB variables
- [ ] Set `CORS_ORIGINS` to your production domain(s)
- [ ] Set `RATE_LIMIT_MAX=100` (for free tier)
- [ ] Optional: Set `LOG_FORMAT=json` for structured logs
- [ ] Optional: Set `DB_POOL_MAX=5` (default is 5 for free tier)
- [ ] Optional: Set `PM2_INSTANCES=1` (default is 1 for single CPU)
- [ ] Optional: Set `PM2_MAX_MEMORY=400M` (default is 400M)

**Verify:**
```bash
cd backend
node -e "require('./src/config/validateEnv').validateEnv()"
```

### 2. Database Configuration ✅

- [ ] Database connection string configured correctly
- [ ] For AWS RDS: SSL enabled in connection string
- [ ] Connection pool settings appropriate for free tier (max 5 connections)
- [ ] Database migrations ready to run

**Test connection:**
```bash
cd backend
node -e "require('./src/config/database').testConnection().then(() => console.log('OK')).catch(e => console.error(e))"
```

### 3. PM2 Configuration ✅

- [ ] `ecosystem.config.js` configured for free tier
  - Single instance mode (fork, not cluster)
  - Memory limit set to 400M
  - Log rotation enabled
- [ ] Verify configuration:
  ```bash
  pm2 ecosystem.config.js --env production --dry-run
  ```

### 4. Nginx Configuration ✅

- [ ] `nginx/fittedin.conf` copied to server
- [ ] Domain name updated in config file
- [ ] SSL certificate paths correct
- [ ] Rate limiting configured appropriately
- [ ] Test configuration:
  ```bash
  sudo nginx -t
  ```

### 5. SSL Certificate ✅

- [ ] Domain DNS points to EC2 instance
- [ ] Certbot installed
- [ ] SSL certificate obtained:
  ```bash
  sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
  ```
- [ ] Auto-renewal configured

## Deployment Steps

### Step 1: Initial Setup

```bash
# On EC2 instance
cd /var/www/fittedin
git pull origin main
cd backend
npm install --production
```

### Step 2: Environment Configuration

```bash
# Create .env file
cp env.production.example .env
nano .env  # Edit with your values

# Verify environment variables
node -e "require('./src/config/validateEnv').validateEnv()"
```

### Step 3: Database Setup

```bash
# Run migrations
npm run db:migrate

# Verify database connection
node -e "require('./src/config/database').testConnection().then(() => console.log('✅ DB OK')).catch(e => console.error('❌ DB Error:', e))"
```

### Step 4: Test Startup Checks

```bash
# Test startup checks (will not start server)
node -e "
  require('dotenv').config();
  require('./src/config/startupChecks').runStartupChecks()
    .then(() => console.log('✅ All checks passed'))
    .catch(e => console.error('❌ Check failed:', e.message))
"
```

### Step 5: Start with PM2

```bash
# Start application
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot (if not already done)
pm2 startup systemd
# Follow the command it outputs
```

### Step 6: Verify Application

```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs fittedin-backend

# Test health endpoint
curl http://localhost:3000/api/health

# Monitor resources
pm2 monit
```

### Step 7: Configure Nginx

```bash
# Copy nginx config
sudo cp /var/www/fittedin/nginx/fittedin.conf /etc/nginx/sites-available/fittedin

# Update domain name in config
sudo nano /etc/nginx/sites-available/fittedin

# Create symlink
sudo ln -s /etc/nginx/sites-available/fittedin /etc/nginx/sites-enabled/

# Remove default (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### Step 8: SSL Certificate

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test renewal
sudo certbot renew --dry-run
```

## Post-Deployment Verification

### Application Status

- [ ] PM2 shows application running: `pm2 status`
- [ ] Health check responds: `curl https://yourdomain.com/api/health`
- [ ] Database connection shows "connected" in health check
- [ ] Frontend loads correctly
- [ ] API endpoints working (test a few endpoints)
- [ ] Authentication working (register/login)

### Security

- [ ] HTTPS working (no mixed content warnings)
- [ ] SSL certificate valid (check browser)
- [ ] Security headers present (use browser dev tools)
- [ ] Rate limiting working (try exceeding limits)
- [ ] CORS configured correctly

### Performance

- [ ] Application starts without errors
- [ ] Memory usage reasonable (check with `pm2 monit`)
- [ ] No memory leaks (monitor over time)
- [ ] Response times acceptable
- [ ] Database queries optimized

### Logging

- [ ] PM2 logs accessible: `pm2 logs fittedin-backend`
- [ ] Log rotation working (check log files)
- [ ] Error logs capture errors correctly
- [ ] Structured logging working (if JSON format enabled)

## Monitoring Commands

```bash
# PM2 status
pm2 status

# View logs
pm2 logs fittedin-backend

# Monitor resources
pm2 monit

# Check specific process
pm2 show fittedin-backend

# Health check
curl http://localhost:3000/api/health

# Check Nginx logs
sudo tail -f /var/log/nginx/fittedin-access.log
sudo tail -f /var/log/nginx/fittedin-error.log

# Check system resources
free -h
df -h
top
```

## Troubleshooting

### Server Won't Start

1. Check environment variables: `cat backend/.env`
2. Run startup checks manually (see Step 4 above)
3. Check PM2 logs: `pm2 logs fittedin-backend`
4. Verify database connection

### High Memory Usage

1. Check current usage: `pm2 monit`
2. Lower `PM2_MAX_MEMORY` if needed
3. Reduce `DB_POOL_MAX` to 3-4
4. Restart application: `pm2 restart fittedin-backend`

### Database Connection Issues

1. Test connection: `psql -h <host> -U <user> -d <database>`
2. Check security groups (AWS RDS)
3. Verify `DATABASE_URL` format
4. Check environment variables

### Rate Limiting Too Strict

1. Adjust `RATE_LIMIT_MAX` in `.env`
2. Modify Nginx rate limits in `nginx/fittedin.conf`
3. Restart services after changes

## Resource Limits for Free Tier

- **CPU**: 1 vCPU core
- **RAM**: 1-2GB
- **Database Connections**: Max 5 (recommended)
- **PM2 Instances**: 1 (single core)
- **Memory Limit**: 400MB per process
- **Rate Limiting**: 100 requests per 15 minutes per IP

## Emergency Rollback

If something goes wrong:

```bash
# Stop application
pm2 stop fittedin-backend

# Rollback code
cd /var/www/fittedin
git checkout <previous-commit>

# Restart
cd backend
npm install --production
npm run db:migrate
pm2 restart fittedin-backend
```

---

**Last Updated**: 2024
**For**: AWS EC2 Free Tier Deployment

