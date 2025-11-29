#!/bin/bash

# FittedIn Database Setup Script
# This script helps set up the database for production deployment

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🗄️  FittedIn Database Setup${NC}"
echo "=========================================="

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}❌ Error: docker-compose.yml not found${NC}"
    echo "Please run this script from the project root directory"
    exit 1
fi

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    exit 1
fi

echo -e "\n${GREEN}📋 Database Setup Options:${NC}"
echo "1. Start Docker PostgreSQL (Quick setup for testing)"
echo "2. Configure AWS RDS connection (Production)"
echo "3. Check current database status"
read -p "Choose an option (1-3): " option

case $option in
    1)
        echo -e "\n${GREEN}🐘 Starting Docker PostgreSQL...${NC}"
        
        # Start PostgreSQL (using docker compose V2)
        docker compose up -d postgres
        
        # Wait for database to be ready
        echo "⏳ Waiting for database to be ready..."
        sleep 10
        
        # Check if database is ready
        if docker compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
            echo -e "${GREEN}✅ PostgreSQL is ready${NC}"
        else
            echo -e "${YELLOW}⚠️  Database might still be starting, please wait...${NC}"
            sleep 10
        fi
        
        # Update .env file
        BACKEND_DIR="backend"
        if [ -d "$BACKEND_DIR" ]; then
            cd "$BACKEND_DIR"
            
            if [ ! -f ".env" ]; then
                echo -e "\n${YELLOW}📝 Creating .env file...${NC}"
                cp env.production.example .env
            fi
            
            # Update database configuration
            echo -e "\n${GREEN}📝 Updating .env with Docker PostgreSQL settings...${NC}"
            
            # Remove existing DB_* variables
            sed -i '/^DB_HOST=/d' .env
            sed -i '/^DB_PORT=/d' .env
            sed -i '/^DB_NAME=/d' .env
            sed -i '/^DB_USER=/d' .env
            sed -i '/^DB_PASSWORD=/d' .env
            sed -i '/^DATABASE_URL=/d' .env
            
            # Add new configuration
            cat >> .env << EOF

# Database Configuration (Docker PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fittedin_dev
DB_USER=postgres
DB_PASSWORD=postgres
EOF
            
            echo -e "${GREEN}✅ .env file updated${NC}"
            echo -e "\n${YELLOW}⚠️  Note: This is for development/testing. For production, use AWS RDS.${NC}"
        fi
        
        echo -e "\n${GREEN}✅ Docker PostgreSQL setup complete!${NC}"
        echo "You can now restart your application:"
        echo "  cd backend && pm2 restart fittedin-backend"
        ;;
        
    2)
        echo -e "\n${GREEN}☁️  AWS RDS Configuration${NC}"
        echo "Please provide your AWS RDS connection details:"
        
        read -p "RDS Endpoint: " rds_endpoint
        read -p "Database Name: " db_name
        read -p "Database User: " db_user
        read -s -p "Database Password: " db_password
        echo ""
        read -p "Database Port [5432]: " db_port
        db_port=${db_port:-5432}
        
        BACKEND_DIR="backend"
        if [ -d "$BACKEND_DIR" ]; then
            cd "$BACKEND_DIR"
            
            if [ ! -f ".env" ]; then
                echo -e "\n${YELLOW}📝 Creating .env file...${NC}"
                cp env.production.example .env
            fi
            
            # Update database configuration
            echo -e "\n${GREEN}📝 Updating .env with AWS RDS settings...${NC}"
            
            # Remove existing DB_* variables and DATABASE_URL
            sed -i '/^DB_HOST=/d' .env
            sed -i '/^DB_PORT=/d' .env
            sed -i '/^DB_NAME=/d' .env
            sed -i '/^DB_USER=/d' .env
            sed -i '/^DB_PASSWORD=/d' .env
            sed -i '/^DATABASE_URL=/d' .env
            
            # Add new configuration using DATABASE_URL
            cat >> .env << EOF

# Database Configuration (AWS RDS)
DATABASE_URL=postgresql://${db_user}:${db_password}@${rds_endpoint}:${db_port}/${db_name}
EOF
            
            echo -e "${GREEN}✅ .env file updated with AWS RDS configuration${NC}"
        fi
        
        echo -e "\n${GREEN}✅ AWS RDS configuration complete!${NC}"
        echo "You can now restart your application:"
        echo "  cd backend && pm2 restart fittedin-backend"
        ;;
        
    3)
        echo -e "\n${GREEN}🔍 Checking Database Status...${NC}"
        
        # Check Docker PostgreSQL
        if docker ps | grep -q "fittedin-postgres\|postgres"; then
            echo -e "${GREEN}✅ Docker PostgreSQL is running${NC}"
            docker ps | grep postgres
        else
            echo -e "${YELLOW}⚠️  Docker PostgreSQL is not running${NC}"
        fi
        
        # Check port 5432
        if sudo lsof -i :5432 > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Port 5432 is in use${NC}"
            sudo lsof -i :5432
        else
            echo -e "${YELLOW}⚠️  Port 5432 is not in use${NC}"
        fi
        
        # Check .env file
        BACKEND_DIR="backend"
        if [ -d "$BACKEND_DIR" ] && [ -f "$BACKEND_DIR/.env" ]; then
            echo -e "\n${GREEN}📝 Current .env database configuration:${NC}"
            grep -E "DB_|DATABASE_URL" "$BACKEND_DIR/.env" || echo "No database configuration found"
        else
            echo -e "${YELLOW}⚠️  .env file not found${NC}"
        fi
        ;;
        
    *)
        echo -e "${RED}❌ Invalid option${NC}"
        exit 1
        ;;
esac

echo -e "\n${GREEN}✅ Setup complete!${NC}"

