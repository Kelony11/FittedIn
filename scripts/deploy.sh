#!/bin/bash

# FittedIn AWS EC2 Deployment Script
# This script automates the deployment process on AWS EC2

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/var/www/fittedin"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"
GIT_REPO_URL="${GIT_REPO_URL:-https://github.com/yourusername/FittedIn.git}"
BRANCH="${BRANCH:-main}"

echo -e "${GREEN}🚀 Starting FittedIn Deployment${NC}"
echo "=========================================="

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then 
    echo -e "${YELLOW}⚠️  This script should be run with sudo privileges${NC}"
    exit 1
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "\n${GREEN}📋 Checking prerequisites...${NC}"

if ! command_exists node; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi

if ! command_exists npm; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi

if ! command_exists pm2; then
    echo -e "${YELLOW}⚠️  PM2 is not installed. Installing...${NC}"
    npm install -g pm2
fi

if ! command_exists nginx; then
    echo -e "${YELLOW}⚠️  Nginx is not installed. Installing...${NC}"
    apt-get update
    apt-get install -y nginx
fi

if ! command_exists git; then
    echo -e "${RED}❌ Git is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All prerequisites met${NC}"

# Create project directory if it doesn't exist
echo -e "\n${GREEN}📁 Setting up project directory...${NC}"
mkdir -p $PROJECT_DIR
cd $PROJECT_DIR

# Clone or update repository
if [ -d "$PROJECT_DIR/.git" ]; then
    echo -e "${GREEN}📥 Updating repository...${NC}"
    git fetch origin
    git checkout $BRANCH
    git pull origin $BRANCH
else
    echo -e "${GREEN}📥 Cloning repository...${NC}"
    git clone -b $BRANCH $GIT_REPO_URL $PROJECT_DIR
fi

# Install backend dependencies
echo -e "\n${GREEN}📦 Installing backend dependencies...${NC}"
cd $BACKEND_DIR
npm install --production

# Check if .env exists
if [ ! -f "$BACKEND_DIR/.env" ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from template...${NC}"
    if [ -f "$BACKEND_DIR/env.production.example" ]; then
        cp $BACKEND_DIR/env.production.example $BACKEND_DIR/.env
        echo -e "${YELLOW}⚠️  Please edit $BACKEND_DIR/.env with your production values${NC}"
    else
        echo -e "${RED}❌ env.production.example not found${NC}"
        exit 1
    fi
fi

# Run database migrations
echo -e "\n${GREEN}🗄️  Running database migrations...${NC}"
cd $BACKEND_DIR
npm run db:migrate || {
    echo -e "${YELLOW}⚠️  Migration failed. Continuing anyway...${NC}"
}

# Install frontend dependencies (if needed)
echo -e "\n${GREEN}📦 Installing frontend dependencies...${NC}"
cd $FRONTEND_DIR
if [ -f "package.json" ]; then
    npm install --production
fi

# Create logs directory
mkdir -p $BACKEND_DIR/logs

# Restart application with PM2
echo -e "\n${GREEN}🔄 Restarting application with PM2...${NC}"
cd $BACKEND_DIR

# Stop existing instance if running
pm2 stop fittedin-backend 2>/dev/null || true
pm2 delete fittedin-backend 2>/dev/null || true

# Start with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
# Get the actual user (not root)
ACTUAL_USER=${SUDO_USER:-$USER}
if [ "$ACTUAL_USER" != "root" ]; then
    pm2 startup systemd -u $ACTUAL_USER --hp /home/$ACTUAL_USER || true
fi

# Copy Nginx configuration
echo -e "\n${GREEN}🌐 Configuring Nginx...${NC}"
if [ -f "$PROJECT_DIR/nginx/fittedin.conf" ]; then
    cp $PROJECT_DIR/nginx/fittedin.conf /etc/nginx/sites-available/fittedin
    
    # Create symlink if it doesn't exist
    if [ ! -L "/etc/nginx/sites-enabled/fittedin" ]; then
        ln -s /etc/nginx/sites-available/fittedin /etc/nginx/sites-enabled/
    fi
    
    # Test Nginx configuration
    nginx -t && {
        systemctl reload nginx
        echo -e "${GREEN}✅ Nginx configuration updated${NC}"
    } || {
        echo -e "${RED}❌ Nginx configuration test failed${NC}"
        exit 1
    }
else
    echo -e "${YELLOW}⚠️  Nginx configuration file not found${NC}"
fi

# Set proper permissions
echo -e "\n${GREEN}🔐 Setting permissions...${NC}"
ACTUAL_USER=${SUDO_USER:-$USER}
if [ "$ACTUAL_USER" != "root" ]; then
    chown -R $ACTUAL_USER:$ACTUAL_USER $PROJECT_DIR
fi
chmod -R 755 $PROJECT_DIR

echo -e "\n${GREEN}✅ Deployment completed successfully!${NC}"
echo "=========================================="
echo -e "📊 Application Status:"
pm2 status
echo -e "\n🌐 Nginx Status:"
systemctl status nginx --no-pager -l
echo -e "\n📝 Useful commands:"
echo "  - View logs: pm2 logs fittedin-backend"
echo "  - Restart app: pm2 restart fittedin-backend"
echo "  - Check status: pm2 status"
echo "  - Monitor: pm2 monit"

