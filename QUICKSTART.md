# 🚀 FittedIn Quick Start Guide

> **For new developers joining the team**

This guide will get you up and running with the FittedIn project in under 10 minutes.

---

## ✅ Prerequisites Check

Before starting, ensure you have:

- **Node.js** v20+ installed: `node --version`
- **Docker** installed and running: `docker --version`
- **Git** installed: `git --version`

If any are missing, install them first.

---

## 🏃‍♂️ Quick Setup (5 minutes)

### Step 1: Clone and Setup
```bash
# Clone the repository
git clone <repository-url>
cd FittedIn

# Run automated setup
./setup.sh
```

### Step 2: Start the Application
```bash
# Start the backend server
cd backend
node server.js
```

### Step 3: Test It Works
Open your browser and go to: **`http://localhost:3000`**

You should see the FittedIn landing page! 🎉

### Step 4: Access Database Management (Optional)
Open **`http://localhost:5050`** for pgAdmin:
- Email: `admin@fittedin.com`
- Password: `admin123`

This gives you a web interface to browse your database tables and data.

---

## 🧪 Quick Test (2 minutes)

### Test Registration
1. Click **"Get Started"** on the landing page
2. Fill out the form:
   - **Display Name:** `Your Name`
   - **Email:** `your.email@example.com`
   - **Password:** `Password123`
   - **Confirm Password:** `Password123`
3. Check "I agree to terms"
4. Click **"Create Account"**

### Test Login
1. Go to the login page
2. Enter your email and password
3. Click **"Login"**

**Success!** You should be redirected to the main page.

---

## 🔧 Development Commands

```bash
# Start database
docker-compose up -d postgres

# Start backend
cd backend && node server.js

# Check if everything is running
curl http://localhost:3000/api/health
```

---

## 📁 What's Currently Working

### ✅ Implemented Features
- **User Registration** - Create new accounts
- **User Login** - Authenticate users
- **JWT Authentication** - Secure API access
- **Password Hashing** - Secure password storage
- **User Dashboard** - Basic user interface
- **API Endpoints** - RESTful authentication API

### 🚧 Next Features to Build
- Goal tracking and management
- Activity logging
- Social connections
- Progress visualization
- User profiles

---

## 🐛 Common Issues & Solutions

### "Cannot connect to Docker daemon"
```bash
# Start Docker Desktop
open -a Docker
# Wait for Docker to start, then try again
```

### "Port 3000 already in use"
```bash
# Find what's using the port
lsof -i :3000
# Kill the process
kill -9 <PID>
```

### "Database connection failed"
```bash
# Restart PostgreSQL
docker-compose restart postgres
# Check if it's running
docker-compose ps
```

### "npm install failed"
```bash
# Clear npm cache and try again
npm cache clean --force
npm install
```

---

## 📚 Next Steps

Once you're up and running:

1. **Read the full documentation:**
   - [README.md](README.md) - Project overview
   - [DEVELOPMENT.md](DEVELOPMENT.md) - Detailed development guide
   - [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture

2. **Explore the codebase:**
   - `backend/src/routes/auth.js` - Authentication endpoints
   - `frontend/public/js/auth.js` - Frontend authentication
   - `backend/src/models/User.js` - User data model

3. **Start contributing:**
   - Pick a feature from the roadmap
   - Create a feature branch
   - Make your changes
   - Test thoroughly
   - Submit a pull request

---

## 🆘 Need Help?

- **Setup Issues:** Check [DEVELOPMENT.md](DEVELOPMENT.md) troubleshooting section
- **Code Questions:** Ask in team chat or create an issue
- **Feature Ideas:** Discuss in team meetings

---

## 🎯 Team Development Workflow

1. **Daily Standup:** Share progress and blockers
2. **Feature Branches:** Always work on feature branches
3. **Code Reviews:** All changes need review before merging
4. **Testing:** Test your changes before submitting
5. **Documentation:** Update docs when adding features

---

**Welcome to the FittedIn team! 🎉**

Happy coding! 🚀
