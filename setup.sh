#!/bin/bash

echo "🚀 Setting up FittedIn Development Environment"
echo "=============================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   Download from: https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v20+ first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please install Node.js v20+ first."
    exit 1
fi

echo "✅ Prerequisites check passed"
echo "   Node.js: $(node --version)"
echo "   Docker: $(docker --version)"

# Start PostgreSQL with Docker
echo ""
echo "🐘 Starting PostgreSQL database..."
if docker-compose up -d postgres; then
    echo "✅ PostgreSQL started successfully"
else
    echo "❌ Failed to start PostgreSQL. Make sure Docker is running."
    echo "   Try: open -a Docker"
    exit 1
fi

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 15

# Check if database is ready
if docker-compose ps | grep -q "Up"; then
    echo "✅ Database is running"
else
    echo "❌ Database failed to start. Check logs with: docker-compose logs postgres"
    exit 1
fi

# Install backend dependencies
echo ""
echo "📦 Installing backend dependencies..."
cd backend
if npm install; then
    echo "✅ Backend dependencies installed"
else
    echo "❌ Failed to install backend dependencies"
    exit 1
fi

# Create .env file if it doesn't exist
echo ""
echo "🔧 Setting up environment variables..."
if [ ! -f .env ]; then
    echo "JWT_SECRET=fittedin-super-secret-jwt-key-for-development-only" > .env
    echo "JWT_EXPIRES_IN=7d" >> .env
    echo "NODE_ENV=development" >> .env
    echo "✅ Environment variables configured"
else
    echo "✅ Environment variables already configured"
fi

# Run database migrations
echo "🗄️  Running database migrations..."
if npx sequelize-cli db:migrate; then
    echo "✅ Database migrations completed"
else
    echo "❌ Database migration failed. Check database connection."
    echo "   Try: docker-compose logs postgres"
    exit 1
fi

# Install frontend dependencies
echo ""
echo "📦 Installing frontend dependencies..."
cd ../frontend
if npm install; then
    echo "✅ Frontend dependencies installed"
else
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi

echo ""
echo "🎉 Setup complete!"
echo "=================="
echo ""
echo "🚀 To start the application:"
echo "   cd backend && node server.js"
echo ""
echo "🌐 Then open your browser to:"
echo "   http://localhost:3000"
echo ""
echo "📚 For more information:"
echo "   - README.md - Project overview"
echo "   - QUICKSTART.md - Quick start guide"
echo "   - DEVELOPMENT.md - Detailed development guide"
echo ""
echo "🆘 If you encounter issues:"
echo "   - Check Docker is running: docker-compose ps"
echo "   - View logs: docker-compose logs postgres"
echo "   - Restart database: docker-compose restart postgres"
echo ""
echo "Happy coding! 🚀"
