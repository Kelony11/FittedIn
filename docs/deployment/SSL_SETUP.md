# SSL Certificate Setup with Let's Encrypt

This guide explains how to set up SSL/TLS certificates for FittedIn using Let's Encrypt (Certbot) on AWS EC2.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Obtaining Certificate](#obtaining-certificate)
- [Configuring Nginx](#configuring-nginx)
- [Auto-Renewal](#auto-renewal)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

- EC2 instance with Ubuntu/Debian
- Domain name pointing to your EC2 instance
- Nginx installed and configured
- Ports 80 and 443 open in Security Group
- Root or sudo access

---

## Installation

### Step 1: Install Certbot

```bash
# Update package list
sudo apt-get update

# Install Certbot and Nginx plugin
sudo apt-get install -y certbot python3-certbot-nginx
```

### Step 2: Verify Nginx Installation

```bash
# Check Nginx version
nginx -v

# Check if Nginx is running
sudo systemctl status nginx
```

---

## Obtaining Certificate

### Step 1: Prepare Nginx Configuration

Before obtaining the certificate, ensure your Nginx configuration is set up:

```bash
# Edit Nginx config (if not already done)
sudo nano /etc/nginx/sites-available/fittedin
```

Make sure your server block includes:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # This will be updated by Certbot
    location / {
        return 301 https://$server_name$request_uri;
    }
}
```

### Step 2: Obtain Certificate

**Option A: Automatic Configuration (Recommended)**

Certbot will automatically configure Nginx:

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Follow the prompts:
- Enter your email address
- Agree to terms of service
- Choose whether to redirect HTTP to HTTPS (recommended: Yes)

**Option B: Manual Configuration**

If you prefer to configure Nginx manually:

```bash
# Obtain certificate only (no auto-config)
sudo certbot certonly --nginx -d yourdomain.com -d www.yourdomain.com
```

### Step 3: Verify Certificate

```bash
# Check certificate details
sudo certbot certificates

# Test certificate
sudo certbot renew --dry-run
```

---

## Configuring Nginx

### Update Nginx Configuration

Edit your Nginx configuration file:

```bash
sudo nano /etc/nginx/sites-available/fittedin
```

Update the HTTPS server block:

```nginx
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Certificate paths (Certbot sets these automatically)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_session_tickets off;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Your application configuration...
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://127.0.0.1:3000;
        # ... proxy settings
    }
}
```

### Test and Reload Nginx

```bash
# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## Auto-Renewal

Let's Encrypt certificates expire every 90 days. Set up automatic renewal:

### Step 1: Test Renewal

```bash
# Test renewal process
sudo certbot renew --dry-run
```

### Step 2: Set Up Cron Job

Certbot includes a renewal script. Verify it's set up:

```bash
# Check if renewal timer is active
sudo systemctl status certbot.timer

# Enable and start timer (if not already active)
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

### Step 3: Manual Cron Job (Alternative)

If you prefer a cron job:

```bash
# Edit crontab
sudo crontab -e

# Add this line (runs twice daily)
0 0,12 * * * certbot renew --quiet --deploy-hook "systemctl reload nginx"
```

### Step 4: Verify Renewal

```bash
# Check renewal schedule
sudo certbot renew --dry-run

# Check certificate expiration
sudo certbot certificates
```

---

## Troubleshooting

### Certificate Not Obtaining

**Problem**: Certbot fails to obtain certificate

**Solutions**:
1. Verify domain DNS points to your EC2 instance
2. Check Security Group allows port 80
3. Ensure Nginx is running
4. Check firewall rules: `sudo ufw status`
5. Verify domain is accessible: `curl http://yourdomain.com`

### Certificate Not Renewing

**Problem**: Auto-renewal not working

**Solutions**:
1. Check Certbot timer: `sudo systemctl status certbot.timer`
2. Test renewal manually: `sudo certbot renew --dry-run`
3. Check logs: `sudo journalctl -u certbot.timer`
4. Verify cron job (if using): `sudo crontab -l`

### Nginx Configuration Errors

**Problem**: Nginx fails to reload after certificate update

**Solutions**:
1. Test configuration: `sudo nginx -t`
2. Check error logs: `sudo tail -f /var/log/nginx/error.log`
3. Verify certificate paths are correct
4. Check file permissions

### Mixed Content Warnings

**Problem**: Browser shows mixed content warnings

**Solutions**:
1. Ensure all resources use HTTPS
2. Update API endpoints to use HTTPS
3. Check browser console for HTTP resources
4. Use Content Security Policy headers

---

## Security Best Practices

1. ✅ **Always use HTTPS** - Redirect all HTTP to HTTPS
2. ✅ **Enable HSTS** - Strict-Transport-Security header
3. ✅ **Use strong SSL configuration** - TLS 1.2+ only
4. ✅ **Regular certificate renewal** - Automated renewal
5. ✅ **Monitor expiration** - Set up alerts
6. ✅ **Keep Certbot updated** - `sudo apt-get upgrade certbot`

---

## Certificate Information

### Certificate Location

- **Certificate**: `/etc/letsencrypt/live/yourdomain.com/fullchain.pem`
- **Private Key**: `/etc/letsencrypt/live/yourdomain.com/privkey.pem`
- **Certificate Chain**: `/etc/letsencrypt/live/yourdomain.com/chain.pem`

### Certificate Details

```bash
# View certificate information
sudo openssl x509 -in /etc/letsencrypt/live/yourdomain.com/fullchain.pem -text -noout

# Check expiration date
sudo certbot certificates
```

---

## Multiple Domains

To add additional domains:

```bash
# Add domain to existing certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com

# Or create separate certificate
sudo certbot --nginx -d api.yourdomain.com
```

---

## Revoking Certificate

If you need to revoke a certificate:

```bash
# Revoke certificate
sudo certbot revoke --cert-path /etc/letsencrypt/live/yourdomain.com/cert.pem

# Delete certificate files
sudo certbot delete --cert-name yourdomain.com
```

---

## Additional Resources

- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Certbot Documentation](https://certbot.eff.org/)
- [SSL Labs Test](https://www.ssllabs.com/ssltest/) - Test your SSL configuration

---

## Quick Reference

```bash
# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Renew certificate
sudo certbot renew

# Test renewal
sudo certbot renew --dry-run

# List certificates
sudo certbot certificates

# Revoke certificate
sudo certbot revoke --cert-path /path/to/cert.pem
```

