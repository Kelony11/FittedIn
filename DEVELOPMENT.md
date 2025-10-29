# Development Guide

This guide covers the development workflow, environment setup, and best practices for contributing to FittedIn.

---

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Common Issues](#common-issues)

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** v20 or higher
- **npm** v9 or higher
- **PostgreSQL** v14 or higher (or Docker)
- **Git**

---

## Local Development Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd FittedIn
```

### 2. Automated Setup (Recommended)

```bash
# Run the automated setup script
./setup.sh
```

This script will:
- Start PostgreSQL with Docker
- Start pgAdmin for database management
- Install backend dependencies
- Run database migrations
- Install frontend dependencies

### 3. Manual Setup (if automated setup fails)

#### Database Setup

```bash
# Start PostgreSQL and pgAdmin containers
docker-compose up -d

# Verify services are running
docker-compose ps
```

#### Database Management with pgAdmin

pgAdmin provides a web-based interface for managing your PostgreSQL database:

**Access pgAdmin:**
- URL: `http://localhost:5050`
- Email: `admin@fittedin.com`
- Password: `admin123`

**Connect to Database:**
1. Right-click "Servers" → "Create" → "Server"
2. General tab:
   - Name: `FittedIn Development`
3. Connection tab:
   - Host: `postgres` (Docker service name)
   - Port: `5432`
   - Database: `fittedin_dev`
   - Username: `postgres`
   - Password: `postgres`
4. Click "Save"

**Useful pgAdmin Features:**
- Browse tables and data
- Execute SQL queries
- View table structures and relationships
- Monitor database performance
- Import/export data

For detailed pgAdmin usage instructions, see [DATABASE_MANAGEMENT.md](DATABASE_MANAGEMENT.md).

**Test pgAdmin Setup:**
```bash
# Run the pgAdmin test script
./test-pgadmin.sh
```

#### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Run database migrations
npx sequelize-cli db:migrate

# Start development server
node server.js
```

The backend server will start at `http://localhost:3000`.

#### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Serve frontend (optional - backend serves it too)
npx http-server public -p 8080
```

The frontend will be available at `http://localhost:3000` (served by backend) or `http://localhost:8080` (if using separate server).


---

## Project Structure

```
FittedIn/
├─ /frontend                     # Static frontend
│  ├─ /public                    # Web root (serve this)
│  │  ├─ index.html              # Landing page
│  │  ├─ login.html              # Login page
│  │  ├─ register.html           # Registration page
│  │  ├─ dashboard.html          # User dashboard
│  │  ├─ /css
│  │  │  ├─ main.css             # Global styles
│  │  │  └─ auth.css             # Authentication page styles
│  │  ├─ /js
│  │  │  ├─ main.js              # Bootstrapping / shared UI logic
│  │  │  ├─ api.js               # API client (fetch helpers)
│  │  │  └─ auth.js              # Authentication flow (frontend)
│  │  └─ favicon.ico
│  ├─ package.json               # Frontend dependencies
│  └─ package-lock.json
│
├─ /backend                      # Node.js backend
│  ├─ /src
│  │  ├─ /routes
│  │  │  ├─ auth.js              # Authentication routes (✅ IMPLEMENTED)
│  │  │  └─ users.js             # User routes (✅ IMPLEMENTED)
│  │  ├─ /models
│  │  │  └─ User.js               # User model (✅ IMPLEMENTED)
│  │  ├─ /middleware
│  │  │  └─ auth.js               # JWT authentication middleware (✅ IMPLEMENTED)
│  │  ├─ /config
│  │  │  ├─ database.js          # Database configuration (✅ IMPLEMENTED)
│  │  │  └─ config.json          # Sequelize configuration (✅ IMPLEMENTED)
│  │  └─ /migrations
│  │      └─ 20241201000001-create-users.js  # User table migration (✅ IMPLEMENTED)
│  ├─ server.js                  # Express entry point (✅ IMPLEMENTED)
│  ├─ package.json               # Backend dependencies (✅ IMPLEMENTED)
│  └─ .sequelizerc               # Sequelize CLI configuration (✅ IMPLEMENTED)
│
├─ docker-compose.yml            # PostgreSQL database (✅ IMPLEMENTED)
├─ setup.sh                      # Automated setup script (✅ IMPLEMENTED)
├─ README.md                     # Project overview and quick start
├─ DEVELOPMENT.md                # This file - development guide
└─ ARCHITECTURE.md               # System architecture documentation

```

---

## Development Workflow

### Branch Strategy

We follow a **feature branch workflow**:

```bash
# Create a new feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add user profile endpoint"

# Push to remote
git push origin feature/your-feature-name

# Create Pull Request on GitHub
```

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation changes
- `style:` code style changes (formatting, etc.)
- `refactor:` code refactoring
- `test:` adding or updating tests
- `chore:` maintenance tasks

### Pull Request Process

1. Create a feature branch from `main`
2. Make your changes
3. Write/update tests
4. Ensure CI checks pass
5. Request review from at least one team member
6. Address review comments
7. Merge after approval

---

## Testing

### Current Implementation Testing

#### 1. Registration Flow Test
```bash
# Test user registration
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "Test User",
    "email": "test@example.com", 
    "password": "Password123"
  }'
```

#### 2. Login Flow Test
```bash
# Test user login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123"
  }'
```

#### 3. Frontend Testing
1. Open `http://localhost:3000` in your browser
2. Click "Get Started" to test registration
3. Use the login page to test authentication
4. Verify dashboard access after login

### Manual Testing Checklist

- [ ] **Registration**: Create new user account
- [ ] **Login**: Authenticate with valid credentials
- [ ] **Invalid Login**: Try wrong password/email
- [ ] **Password Validation**: Test weak passwords
- [ ] **Email Validation**: Test invalid email formats
- [ ] **Dashboard Access**: Verify protected route access
- [ ] **Logout**: Test logout functionality

### API Testing with cURL

```bash
# Health check
curl http://localhost:3000/api/health

# Registration
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"displayName":"John Doe","email":"john@example.com","password":"Password123"}'

# Login (save the token from response)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"Password123"}'

# Get user profile (replace TOKEN with actual token)
curl -H "Authorization: Bearer TOKEN" http://localhost:3000/api/users/1
```

### Frontend Testing

```bash
# Serve frontend separately (optional)
cd frontend
npx http-server public -p 8080
# Open http://localhost:8080
```

---

## Common Issues

### Database Connection Errors

**Problem:** `ECONNREFUSED` when connecting to PostgreSQL

**Solution:**
```bash
# Check if PostgreSQL is running
docker compose ps
# Or for local installation:
pg_isready

# Restart PostgreSQL
docker compose restart
```

### Port Already in Use

**Problem:** `EADDRINUSE` error when starting server

**Solution:**
```bash
# Find process using the port
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Migration Errors

**Problem:** Migration fails or database is out of sync

**Solution:**
```bash
# Rollback all migrations
npx sequelize-cli db:migrate:undo:all

# Re-run migrations
npx sequelize-cli db:migrate
```

### Node Module Issues

**Problem:** `MODULE_NOT_FOUND` errors

**Solution:**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

---

## Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fittedin_dev
DB_USER=postgres
DB_PASSWORD=postgres

# Server
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d

# Optional
LOG_LEVEL=debug
```

---

## Useful Commands

```bash
# Backend
npm run dev              # Start dev server with hot reload
npm run lint             # Run ESLint
npm run format           # Format code with Prettier
npm run db:reset         # Reset database (drop + migrate + seed)

# Frontend
npx http-server public   # Serve frontend files

# Database
npx sequelize-cli migration:generate --name migration-name
npx sequelize-cli db:migrate
npx sequelize-cli db:migrate:undo
```

---

## Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [Sequelize Documentation](https://sequelize.org/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Chart.js Documentation](https://www.chartjs.org/)

---

For contribution guidelines and Git workflow, see [CONTRIBUTING.md](CONTRIBUTING.md).