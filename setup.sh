#!/bin/bash

# FittedIn Setup Script
# Supports both local development and EC2 production deployment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Detect deployment mode
# Check if running on EC2 (in /var/www/fittedin or running with sudo/root)
IS_EC2=false
if [ -d "/var/www/fittedin" ] || [ "$EUID" -eq 0 ] || [ -n "$SUDO_USER" ]; then
    IS_EC2=true
    DEPLOYMENT_MODE="EC2 Production"
    PROJECT_DIR="/var/www/fittedin"
    BACKEND_DIR="$PROJECT_DIR/backend"
    FRONTEND_DIR="$PROJECT_DIR/frontend"
else
    DEPLOYMENT_MODE="Local Development"
    PROJECT_DIR="$(pwd)"
    BACKEND_DIR="$PROJECT_DIR/backend"
    FRONTEND_DIR="$PROJECT_DIR/frontend"
fi

echo -e "${GREEN}🚀 FittedIn Setup - ${DEPLOYMENT_MODE}${NC}"
echo "=============================================="

# EC2 Production Deployment
if [ "$IS_EC2" = true ]; then
    echo -e "${BLUE}📦 Detected EC2 production environment${NC}"
    echo ""
    
    # Check if running as root or with sudo
    if [ "$EUID" -ne 0 ]; then 
        echo -e "${YELLOW}⚠️  This script should be run with sudo privileges on EC2${NC}"
        echo "   Usage: sudo ./setup.sh"
        exit 1
    fi
    
    # Function to check if command exists
    command_exists() {
        command -v "$1" >/dev/null 2>&1
    }
    
    # Check prerequisites
    echo -e "${GREEN}📋 Checking prerequisites...${NC}"
    
    if ! command_exists node; then
        echo -e "${YELLOW}⚠️  Node.js is not installed. Installing Node.js 20.x...${NC}"
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt-get install -y nodejs
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
        systemctl start nginx
        systemctl enable nginx
    fi
    
    if ! command_exists git; then
        echo -e "${YELLOW}⚠️  Git is not installed. Installing...${NC}"
        apt-get update
        apt-get install -y git
    fi
    
    echo -e "${GREEN}✅ All prerequisites met${NC}"
    echo "   Node.js: $(node --version)"
    echo "   npm: $(npm --version)"
    echo "   PM2: $(pm2 --version 2>/dev/null || echo 'installed')"
    echo "   Nginx: $(nginx -v 2>&1 | cut -d'/' -f2)"
    
    # Create project directory if it doesn't exist
    echo -e "\n${GREEN}📁 Setting up project directory...${NC}"
    mkdir -p $PROJECT_DIR
    cd $PROJECT_DIR
    
    # Clone or update repository
    GIT_REPO_URL="${GIT_REPO_URL:-https://github.com/zhihungchen/FittedIn.git}"
    BRANCH="${BRANCH:-main}"
    
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
    
    echo -e "\n${GREEN}✅ EC2 Deployment completed successfully!${NC}"
    echo "=========================================="
    echo -e "📊 Application Status:"
    pm2 status
    echo -e "\n🌐 Nginx Status:"
    systemctl status nginx --no-pager -l | head -5
    echo -e "\n📝 Useful commands:"
    echo "  - View logs: pm2 logs fittedin-backend"
    echo "  - Restart app: pm2 restart fittedin-backend"
    echo "  - Check status: pm2 status"
    echo "  - Monitor: pm2 monit"
    echo "  - Nginx logs: sudo tail -f /var/log/nginx/error.log"
    
# Local Development Setup
else
    echo -e "${BLUE}💻 Detected local development environment${NC}"
    echo ""
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
        echo "   Download from: https://www.docker.com/products/docker-desktop"
        exit 1
    fi
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js is not installed. Please install Node.js v20+ first.${NC}"
        echo "   Download from: https://nodejs.org/"
        exit 1
    fi
    
    # Check Node.js version
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 20 ]; then
        echo -e "${RED}❌ Node.js version $NODE_VERSION is too old. Please install Node.js v20+ first.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Prerequisites check passed${NC}"
    echo "   Node.js: $(node --version)"
    echo "   Docker: $(docker --version)"
    
    # Start PostgreSQL and pgAdmin with Docker
    echo ""
    echo -e "${GREEN}🐘 Starting PostgreSQL database and pgAdmin...${NC}"
    # Use docker compose (V2) instead of docker-compose (V1)
    if docker compose up -d; then
        echo -e "${GREEN}✅ PostgreSQL and pgAdmin started successfully${NC}"
    else
        echo -e "${RED}❌ Failed to start services. Make sure Docker is running.${NC}"
        echo "   Try: open -a Docker"
        exit 1
    fi
    
    # Wait for database to be ready
    echo "⏳ Waiting for database to be ready..."
    sleep 15
    
    # Check if database is ready
    if docker compose ps | grep -q "Up"; then
        echo -e "${GREEN}✅ Database is running${NC}"
    else
        echo -e "${RED}❌ Database failed to start. Check logs with: docker compose logs postgres${NC}"
        exit 1
    fi
    
    # Install backend dependencies
    echo ""
    echo -e "${GREEN}📦 Installing backend dependencies...${NC}"
    cd backend
    if npm install; then
        echo -e "${GREEN}✅ Backend dependencies installed${NC}"
    else
        echo -e "${RED}❌ Failed to install backend dependencies${NC}"
        exit 1
    fi
    
    # Create .env file if it doesn't exist
    echo ""
    echo -e "${GREEN}🔧 Setting up environment variables...${NC}"
    if [ ! -f .env ]; then
        echo "JWT_SECRET=fittedin-super-secret-jwt-key-for-development-only" > .env
        echo "JWT_EXPIRES_IN=7d" >> .env
        echo "NODE_ENV=development" >> .env
        echo -e "${GREEN}✅ Environment variables configured${NC}"
    else
        echo -e "${GREEN}✅ Environment variables already configured${NC}"
    fi
    
    # Run database migrations
    echo -e "${GREEN}🗄️  Running database migrations...${NC}"
    if npx sequelize-cli db:migrate; then
        echo -e "${GREEN}✅ Database migrations completed${NC}"
    else
        echo -e "${RED}❌ Database migration failed. Check database connection.${NC}"
        echo "   Try: docker compose logs postgres"
        exit 1
    fi
    
    # Install frontend dependencies
    echo ""
    echo -e "${GREEN}📦 Installing frontend dependencies...${NC}"
    cd ../frontend
    if npm install; then
        echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
    else
        echo -e "${RED}❌ Failed to install frontend dependencies${NC}"
        exit 1
    fi
    
    echo ""
    echo -e "${GREEN}🎉 Setup complete!${NC}"
    echo "=================="
    echo ""
    echo "🚀 To start the application:"
    echo "   cd backend && node server.js"
    echo ""
    echo "🌐 Then open your browser to:"
    echo "   http://localhost:3000 - Main application"
    echo "   http://localhost:5050 - pgAdmin (Database management)"
    echo ""
    echo "🔑 pgAdmin credentials:"
    echo "   Email: admin@fittedin.com"
    echo "   Password: admin123"
    echo ""
    echo "📚 For more information:"
    echo "   - README.md - Project overview"
    echo "   - docs/getting-started/QUICKSTART.md - Quick start guide"
    echo "   - docs/development/DEVELOPMENT.md - Detailed development guide"
    echo ""
    echo "🆘 If you encounter issues:"
    echo "   - Check Docker is running: docker compose ps"
    echo "   - View logs: docker compose logs postgres"
    echo "   - Restart services: docker compose restart"
    echo ""
    echo "Happy coding! 🚀"
fi
