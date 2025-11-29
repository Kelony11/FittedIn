# Deployment Configuration Changes

## Summary

This document summarizes the changes made to support manual deployment using `setup.sh` and Docker-based Nginx setup.

## Changes Made

### 1. GitHub Actions Disabled

- **Status**: ✅ Disabled
- **Files**:
  - `.github/workflows/deploy.yml` → `.github/workflows/deploy.yml.disabled`
  - `.github/workflows/test.yml` → `.github/workflows/test.yml.disabled`
- **Reason**: Using manual deployment with `setup.sh` instead of automated GitHub Actions

### 2. Updated setup.sh for EC2 Deployment

- **Status**: ✅ Updated
- **Changes**:
  - Auto-detects environment (local development vs EC2 production)
  - On EC2: Installs Node.js, PM2, Nginx, Git if needed
  - On EC2: Clones/updates repository, installs dependencies, runs migrations
  - On EC2: Starts application with PM2 and configures Nginx
  - On Local: Uses Docker Compose for PostgreSQL and pgAdmin
- **Docker Commands**: Updated from `docker-compose` to `docker compose` (V2)

### 3. Docker Compose Configuration

- **Status**: ✅ Updated
- **File**: `docker-compose.yml`
- **Changes**:
  - Added Nginx service to run in Docker container
  - Nginx proxies to host machine application (via `host.docker.internal`)
  - Mounts frontend static files
  - Configures logs directory
  - Uses Docker network for service communication

### 4. Nginx Configuration

- **Status**: ✅ Updated
- **Files**:
  - `nginx/fittedin.conf` - Production configuration (for direct Nginx installation)
  - `nginx/fittedin.docker.conf` - Docker-specific configuration (development/production)
- **Changes**:
  - Updated upstream to use `host.docker.internal:3000` for Docker setup
  - Docker config uses HTTP only (no SSL) for development
  - Production config supports SSL/HTTPS

### 5. Script Updates

- **Status**: ✅ Updated
- **Files**:
  - `setup.sh` - Now supports both local and EC2 deployment
  - `test-pgadmin.sh` - Updated to use `docker compose`
  - `scripts/setup-database.sh` - Updated to use `docker compose`

### 6. Documentation

- **Status**: ✅ Updated
- **Files**:
  - `README.md` - Updated to reflect GitHub Actions disabled, manual deployment
  - `docs/deployment/MANUAL_DEPLOYMENT.md` - New guide for manual EC2 deployment

## Deployment Architecture

### Local Development
```
┌─────────────────┐
│  Docker Compose │
│  - PostgreSQL   │
│  - pgAdmin      │
│  - Nginx        │
└─────────────────┘
         │
         │ (host.docker.internal:3000)
         ▼
┌─────────────────┐
│  Host Machine   │
│  - Node.js App  │
│  (PM2 or node)  │
└─────────────────┘
```

### EC2 Production
```
┌─────────────────┐
│  Docker Compose │
│  - PostgreSQL   │
│  - Nginx        │
└─────────────────┘
         │
         │ (host.docker.internal:3000)
         ▼
┌─────────────────┐
│  EC2 Host       │
│  - Node.js App  │
│  (PM2)          │
└─────────────────┘
```

## How to Deploy

### Local Development
```bash
# Start Docker services (PostgreSQL, pgAdmin, Nginx)
docker compose up -d

# Start Node.js application on host
cd backend
node server.js
# or
pm2 start ecosystem.config.js
```

### EC2 Production
```bash
# SSH to EC2
ssh -i key.pem ubuntu@ec2-ip

# Clone repository
sudo mkdir -p /var/www/fittedin
cd /var/www/fittedin
sudo git clone https://github.com/zhihungchen/FittedIn.git .
sudo chown -R $USER:$USER /var/www/fittedin

# Configure environment
cd backend
cp env.production.example .env
nano .env  # Edit production values

# Run setup script (auto-detects EC2)
sudo ./setup.sh

# Start Docker services
sudo docker compose up -d
```

## Important Notes

1. **GitHub Actions**: Currently disabled. To re-enable:
   ```bash
   mv .github/workflows/deploy.yml.disabled .github/workflows/deploy.yml
   mv .github/workflows/test.yml.disabled .github/workflows/test.yml
   ```

2. **Docker Commands**: All scripts now use `docker compose` (V2) instead of `docker-compose` (V1)

3. **Nginx in Docker**: 
   - Uses `host.docker.internal` to access host machine services
   - On Linux, requires `extra_hosts` mapping in docker-compose.yml
   - Frontend static files are mounted as volume

4. **Network Configuration**:
   - Nginx container listens on ports 80 and 443
   - Node.js app runs on host machine port 3000
   - Nginx proxies `/api/*` to `host.docker.internal:3000`

## Testing

Before committing, verify:
- [x] GitHub Actions workflows are disabled
- [x] setup.sh works in both local and EC2 environments
- [x] Docker Compose starts all services correctly
- [x] Nginx can proxy to host machine application
- [x] All scripts use `docker compose` (V2)
- [x] Documentation is updated

## Next Steps

1. Test Docker Compose setup locally
2. Test Nginx proxy to host application
3. Test setup.sh on EC2
4. Commit changes to GitHub
5. Deploy to production using manual deployment

