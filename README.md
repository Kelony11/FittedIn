# FittedIn — Health & Wellness Networking Platform

> **ECE 452 Software Engineering Project**  
> Group 1: Chih-hung Chen, Haoyang Guo, Alaric Li, Yixiao Xiao, Adam Ashby, Carlos Ortiz, Kelvin Ihezue  
> Semester: Fall 2025

---

## 📖 Overview

Most health applications are **data-driven** — they count steps, calories, or workouts — but often fail to create a **sense of community**. As a result, users start with enthusiasm but quickly lose motivation.

**FittedIn** aims to change this by reimagining health and wellness tracking as a **social, networking-style experience**, inspired by LinkedIn. The platform encourages **connections, accountability, and shared progress**, turning isolated health efforts into **collaborative journeys**.

---

## ✨ Features (Current Implementation)

### 🔐 Authentication System
- **Secure Registration**: JWT-based user registration with password validation
- **Login System**: Email/password authentication with bcrypt password hashing
- **Protected Routes**: JWT middleware for securing API endpoints
- **User Profiles**: Basic user profile management

### 🎯 Core Features (Planned)
- **Goal Tracking**: Set and monitor personal wellness goals
- **Activity Logging**: Record daily activities and progress
- **Social Networking**: Connect with friends and accountability partners
- **Progress Sharing**: Share achievements and milestones
- **Community Support**: Get motivated by others' journeys

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** v20 or higher
- **Docker** (for PostgreSQL)
- **Git**

### One-Command Setup
```bash
# Clone the repository
git clone <repository-url>
cd FittedIn

# Run the automated setup script
./setup.sh
```

### Manual Setup (if automated setup fails)

#### 1. Start Database
```bash
# Start PostgreSQL and pgAdmin with Docker
docker-compose up -d
```

#### 2. Backend Setup
```bash
cd backend
npm install
npx sequelize-cli db:migrate
```

#### 3. Frontend Setup
```bash
cd frontend
npm install
```

### 🏃‍♂️ Running the Application

#### Option A: Backend Only (Recommended)
```bash
cd backend
node server.js
```
**Access at:** 
- `http://localhost:3000` - Main application
- `http://localhost:5050` - pgAdmin (Database management)
  - Email: `admin@fittedin.com`
  - Password: `admin123`

#### Option B: Separate Frontend/Backend
```bash
# Terminal 1 - Backend
cd backend && node server.js

# Terminal 2 - Frontend
cd frontend && npx http-server public -p 8080
```

---

## 🧪 Testing the Login System

### 1. Registration Test
1. Go to `http://localhost:3000`
2. Click "Get Started"
3. Fill out the form:
   - **Display Name:** `John Doe`
   - **Email:** `john@example.com`
   - **Password:** `Password123` (must have uppercase, lowercase, number)
   - **Confirm Password:** `Password123`
4. Check "I agree to terms"
5. Click "Create Account"

### 2. Login Test
1. Go to `http://localhost:3000/login.html`
2. Enter credentials:
   - **Email:** `john@example.com`
   - **Password:** `Password123`
3. Click "Login"

### 3. Dashboard Test
1. After login, you'll be redirected to the main page
2. Access `http://localhost:3000/dashboard.html` to see the user dashboard

---

## 📁 Project Structure

```
FittedIn/
├── backend/                 # Node.js backend
│   ├── src/
│   │   ├── routes/         # API endpoints (auth, users)
│   │   ├── models/         # Database models (User)
│   │   ├── middleware/     # Authentication middleware
│   │   ├── config/         # Database configuration
│   │   └── migrations/     # Database migrations
│   ├── server.js           # Express server entry point
│   └── package.json
├── frontend/               # Static frontend
│   ├── public/
│   │   ├── index.html      # Landing page
│   │   ├── login.html      # Login page
│   │   ├── register.html   # Registration page
│   │   ├── dashboard.html  # User dashboard
│   │   ├── js/            # JavaScript files
│   │   └── css/           # Stylesheets
│   └── package.json
├── docker-compose.yml      # PostgreSQL database
├── setup.sh               # Automated setup script
└── README.md
```

---

## 🛠️ Technology Stack

### Frontend
- **HTML5, CSS3, Vanilla JavaScript** — no frontend frameworks
- **Chart.js** — visualization for progress charts (planned)

### Backend
- **Node.js (v20+) + Express.js** — REST API endpoints
- **Sequelize ORM + PostgreSQL** — SQL database, schema migrations
- **JWT Authentication** — secure authentication
- **bcrypt** — password hashing
- **Helmet, CORS, Rate Limiting** — security middleware

### Development Tools
- **Docker + Docker Compose** — PostgreSQL database
- **Sequelize CLI** — database migrations
- **cURL / Postman** — API testing

---

## 🔧 Development Commands

```bash
# Backend
cd backend
node server.js          # Start server
npm run dev             # Start with nodemon (if installed)

# Database
npx sequelize-cli db:migrate        # Run migrations
npx sequelize-cli db:migrate:undo   # Rollback migration
docker-compose ps                   # Check database status
docker-compose logs postgres        # View database logs

# Frontend
cd frontend
npx http-server public -p 8080      # Serve frontend files
```

---

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker-compose ps

# Restart database
docker-compose restart postgres

# View database logs
docker-compose logs postgres
```

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Migration Issues
```bash
# Reset database
npx sequelize-cli db:migrate:undo:all
npx sequelize-cli db:migrate
```

### Server Won't Start
```bash
# Check if you're in the right directory
cd /Users/andrew/projects/FittedIn/backend

# Install dependencies
npm install

# Start server
node server.js
```

---

## 📚 Documentation

### Setup & Development
- [DEVELOPMENT.md](DEVELOPMENT.md) - Detailed development setup and workflow
- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture and design decisions
- [QUICKSTART.md](QUICKSTART.md) - Quick start guide

### Midterm Presentation
- [MIDTERM_PRESENTATION_CHECKLIST.md](MIDTERM_PRESENTATION_CHECKLIST.md) - Complete preparation checklist for midterm presentation
- [MIDTERM_SUMMARY.md](MIDTERM_SUMMARY.md) - Summary of completed features and demo flow

### Feature Documentation
- [DASHBOARD_IMPROVEMENTS.md](DASHBOARD_IMPROVEMENTS.md) - Dashboard personalization features documentation
- [ARCHITECTURE_IMPROVEMENT.md](ARCHITECTURE_IMPROVEMENT.md) - Architecture improvements and decisions
- [PROFILE_DEMO.md](PROFILE_DEMO.md) - Profile system demo guide
- [DATABASE_MANAGEMENT.md](DATABASE_MANAGEMENT.md) - pgAdmin usage guide

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🆘 Support

If you encounter any issues:

1. Check the [Troubleshooting](#-troubleshooting) section
2. Review the logs: `docker-compose logs postgres`
3. Ensure all prerequisites are installed
4. Try running the setup script again: `./setup.sh`
5. Check that you're in the correct directory when running commands

---

## 🎯 Next Steps

Once the basic authentication is working, the team can work on:

1. **Goal Management**: Create, update, and track user goals
2. **Activity Logging**: Record daily activities and progress
3. **Social Features**: User connections and networking
4. **Progress Visualization**: Charts and reports
5. **Mobile Responsiveness**: Improve UI for mobile devices