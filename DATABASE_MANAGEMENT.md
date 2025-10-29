# 🗄️ Database Management Guide

This guide covers how to use pgAdmin to manage your FittedIn PostgreSQL database during development.

---

## 📋 Table of Contents

- [Accessing pgAdmin](#accessing-pgadmin)
- [Connecting to Database](#connecting-to-database)
- [Database Schema Overview](#database-schema-overview)
- [Common Tasks](#common-tasks)
- [Troubleshooting](#troubleshooting)

---

## 🔑 Accessing pgAdmin

### Quick Access
- **URL:** `http://localhost:5050`
- **Email:** `admin@fittedin.com`
- **Password:** `admin123`

### Starting pgAdmin
```bash
# Start all services (PostgreSQL + pgAdmin)
docker-compose up -d

# Check if services are running
docker-compose ps
```

---

## 🔌 Connecting to Database

### First-Time Setup

1. **Login to pgAdmin**
   - Open `http://localhost:5050`
   - Enter credentials above

2. **Add Server Connection**
   - Right-click "Servers" in the left panel
   - Select "Create" → "Server..."

3. **General Tab**
   - **Name:** `FittedIn Development`

4. **Connection Tab**
   - **Host name/address:** `postgres` (Docker service name)
   - **Port:** `5432`
   - **Maintenance database:** `fittedin_dev`
   - **Username:** `postgres`
   - **Password:** `postgres`

5. **Save Connection**
   - Click "Save" to create the connection

### Connection Details
- **Host:** `postgres` (Docker internal network)
- **Port:** `5432`
- **Database:** `fittedin_dev`
- **Username:** `postgres`
- **Password:** `postgres`

---

## 📊 Database Schema Overview

### Current Tables

#### 1. **users** Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    avatar_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose:** Core user authentication and basic profile information

#### 2. **profiles** Table
```sql
CREATE TABLE profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pronouns VARCHAR(50),
    bio TEXT,
    location VARCHAR(100),
    date_of_birth DATE,
    height INTEGER, -- in centimeters
    weight DECIMAL(5, 2), -- in kg
    fitness_level ENUM('beginner', 'intermediate', 'advanced'),
    primary_goals JSON DEFAULT '[]',
    skills JSON DEFAULT '[]',
    privacy_settings JSON DEFAULT '{
        "profile_visibility": "public",
        "show_activity": true,
        "show_goals": true,
        "show_connections": true
    }',
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

**Purpose:** Extended user profile information and preferences

#### 3. **goals** Table
```sql
CREATE TABLE goals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category ENUM(
        'weight_loss', 'weight_gain', 'muscle_gain', 'cardio',
        'flexibility', 'nutrition', 'mental_health', 'sleep',
        'hydration', 'other'
    ) DEFAULT 'other',
    target_value DECIMAL(10, 2) NOT NULL,
    current_value DECIMAL(10, 2) DEFAULT 0,
    unit VARCHAR(50) DEFAULT 'units',
    start_date DATE DEFAULT CURRENT_DATE,
    target_date DATE,
    status ENUM('active', 'completed', 'paused', 'cancelled') DEFAULT 'active',
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    is_public BOOLEAN DEFAULT true,
    milestones JSON DEFAULT '[]',
    notes TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

**Purpose:** User wellness goals and progress tracking

---

## 🛠️ Common Tasks

### 1. Browse Data

**View All Users:**
```sql
SELECT id, email, display_name, created_at 
FROM users 
ORDER BY created_at DESC;
```

**View User Profiles:**
```sql
SELECT u.display_name, p.location, p.fitness_level, p.primary_goals
FROM users u
JOIN profiles p ON u.id = p.user_id
WHERE p.location IS NOT NULL;
```

**View Goals:**
```sql
SELECT u.display_name, g.title, g.category, g.status, g.target_value, g.current_value
FROM goals g
JOIN users u ON g.user_id = u.id
WHERE g.status = 'active'
ORDER BY g.created_at DESC;
```

### 2. Execute Custom Queries

1. **Open Query Tool**
   - Right-click on database name
   - Select "Query Tool"

2. **Write SQL Query**
   ```sql
   -- Example: Find users by location
   SELECT u.display_name, p.location, p.fitness_level
   FROM users u
   JOIN profiles p ON u.id = p.user_id
   WHERE p.location ILIKE '%New York%';
   ```

3. **Execute Query**
   - Press `F5` or click "Execute" button
   - View results in the data output panel

### 3. View Table Structure

1. **Navigate to Table**
   - Expand "FittedIn Development" → "Databases" → "fittedin_dev" → "Schemas" → "public" → "Tables"

2. **View Column Details**
   - Right-click table name → "Properties"
   - Check "Columns" tab for field details

### 4. Export Data

1. **Select Data to Export**
   - Right-click table → "View/Edit Data" → "All Rows"

2. **Export Options**
   - Click "Download" button
   - Choose format: CSV, JSON, SQL, etc.

### 5. Import Data

1. **Open Import Tool**
   - Right-click table → "Import/Export..."

2. **Configure Import**
   - Select file format
   - Choose file path
   - Map columns if needed

---

## 🔍 Useful Queries for Development

### User Statistics
```sql
-- Total users
SELECT COUNT(*) as total_users FROM users;

-- Users with profiles
SELECT COUNT(*) as users_with_profiles 
FROM users u 
JOIN profiles p ON u.id = p.user_id;

-- Users by fitness level
SELECT fitness_level, COUNT(*) as count
FROM profiles 
WHERE fitness_level IS NOT NULL
GROUP BY fitness_level;
```

### Goal Analytics
```sql
-- Goals by category
SELECT category, COUNT(*) as count
FROM goals 
GROUP BY category
ORDER BY count DESC;

-- Active goals by user
SELECT u.display_name, COUNT(g.id) as active_goals
FROM users u
LEFT JOIN goals g ON u.id = g.user_id AND g.status = 'active'
GROUP BY u.id, u.display_name
ORDER BY active_goals DESC;
```

### Data Validation
```sql
-- Users without profiles
SELECT u.id, u.display_name, u.email
FROM users u
LEFT JOIN profiles p ON u.id = p.user_id
WHERE p.user_id IS NULL;

-- Invalid email formats
SELECT id, email 
FROM users 
WHERE email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
```

---

## 🚨 Troubleshooting

### Connection Issues

**Problem:** Cannot connect to database
```bash
# Check if containers are running
docker-compose ps

# Check PostgreSQL logs
docker-compose logs postgres

# Restart services
docker-compose restart
```

**Problem:** pgAdmin shows "Server not found"
- Ensure you're using `postgres` as hostname (not `localhost`)
- Check that PostgreSQL container is healthy
- Verify port 5432 is not blocked

### Performance Issues

**Problem:** Slow queries
```sql
-- Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

**Problem:** Missing indexes
```sql
-- Check existing indexes
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename;
```

### Data Issues

**Problem:** Orphaned records
```sql
-- Find goals without valid users
SELECT g.id, g.user_id, g.title
FROM goals g
LEFT JOIN users u ON g.user_id = u.id
WHERE u.id IS NULL;
```

---

## 📚 Additional Resources

- [pgAdmin Documentation](https://www.pgadmin.org/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Compose Reference](https://docs.docker.com/compose/)

---

## 🔧 Development Tips

### Quick Database Reset
```bash
# Stop services
docker-compose down

# Remove volumes (⚠️ This deletes all data)
docker-compose down -v

# Restart and migrate
docker-compose up -d
cd backend && npx sequelize-cli db:migrate
```

### Backup Database
```bash
# Create backup
docker-compose exec postgres pg_dump -U postgres fittedin_dev > backup.sql

# Restore backup
docker-compose exec -T postgres psql -U postgres fittedin_dev < backup.sql
```

### Monitor Database Performance
```sql
-- Active connections
SELECT count(*) as active_connections 
FROM pg_stat_activity 
WHERE state = 'active';

-- Database size
SELECT pg_size_pretty(pg_database_size('fittedin_dev')) as database_size;
```

---

For more advanced database operations, see [DEVELOPMENT.md](DEVELOPMENT.md).
