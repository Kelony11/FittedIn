#!/bin/bash

echo "🧪 Testing pgAdmin Setup"
echo "========================"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if containers are running
echo "📋 Checking container status..."
if docker compose ps | grep -q "Up"; then
    echo "✅ Containers are running"
else
    echo "⚠️  Containers not running. Starting them..."
    docker compose up -d
    echo "⏳ Waiting for services to be ready..."
    sleep 20
fi

# Check PostgreSQL health
echo "🐘 Checking PostgreSQL health..."
if docker compose exec postgres pg_isready -U postgres > /dev/null 2>&1; then
    echo "✅ PostgreSQL is healthy"
else
    echo "❌ PostgreSQL is not responding"
    echo "   Check logs: docker compose logs postgres"
    exit 1
fi

# Check pgAdmin accessibility
echo "🔧 Checking pgAdmin accessibility..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:5050 | grep -q "200"; then
    echo "✅ pgAdmin is accessible at http://localhost:5050"
else
    echo "❌ pgAdmin is not accessible"
    echo "   Check logs: docker compose logs pgadmin"
    exit 1
fi

# Test database connection
echo "🔌 Testing database connection..."
if docker compose exec postgres psql -U postgres -d fittedin_dev -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ Database connection successful"
else
    echo "❌ Database connection failed"
    exit 1
fi

# Check if tables exist
echo "📊 Checking database tables..."
TABLES=$(docker compose exec postgres psql -U postgres -d fittedin_dev -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')

if [ "$TABLES" -gt 0 ]; then
    echo "✅ Database has $TABLES table(s)"
    
    # List tables
    echo "📋 Available tables:"
    docker compose exec postgres psql -U postgres -d fittedin_dev -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;" 2>/dev/null
else
    echo "⚠️  No tables found. Run migrations:"
    echo "   cd backend && npx sequelize-cli db:migrate"
fi

echo ""
echo "🎉 pgAdmin Setup Test Complete!"
echo "==============================="
echo ""
echo "🌐 Access URLs:"
echo "   Main App: http://localhost:3000"
echo "   pgAdmin:  http://localhost:5050"
echo ""
echo "🔑 pgAdmin Credentials:"
echo "   Email:    admin@fittedin.com"
echo "   Password: admin123"
echo ""
echo "📚 For detailed usage instructions:"
echo "   See DATABASE_MANAGEMENT.md"
echo ""
echo "Happy database management! 🚀"
