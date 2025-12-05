# FittedIn — Health & Wellness Networking Platform

- **Software Engineering Project** 

<!-- GitHub Actions workflows are currently disabled - using manual deployment with setup.sh -->
<!-- [![Test](https://github.com/zhihungchen/FittedIn/actions/workflows/test.yml/badge.svg)](https://github.com/zhihungchen/FittedIn/actions/workflows/test.yml) -->
<!-- [![Deploy](https://github.com/zhihungchen/FittedIn/actions/workflows/deploy.yml/badge.svg)](https://github.com/zhihungchen/FittedIn/actions/workflows/deploy.yml) -->

<div align="center">
  <img src="docs/screenshots/homepage-hero.png" alt="FittedIn Homepage - Transform Your Health Journey" width="900"/>
  <br/>
  <a href="https://fittedin.cchung.online/">
    <strong>🌐 Visit Live Website →</strong>
  </a>
</div>

---

## Overview

Most health applications are **data-driven** — they count steps, calories, or workouts — but often fail to create a **sense of community**. As a result, users start with enthusiasm but quickly lose motivation.

**FittedIn** aims to change this by reimagining health and wellness tracking as a **social, networking-style experience**, inspired by LinkedIn. The platform encourages **connections, accountability, and shared progress**, turning isolated health efforts into **collaborative journeys**.

---

## Tech Stack & Architecture

### **Backend Architecture**
- **Runtime**: Node.js v20+ with Express.js framework
- **Database**: PostgreSQL 15+ with Sequelize ORM
- **Authentication**: JWT-based stateless auth with bcrypt password hashing (10 salt rounds)
- **Architecture Pattern**: Three-tier architecture (Presentation → Application → Data Layer)
- **API Design**: RESTful API with proper HTTP methods and status codes
- **Code Organization**: MVC pattern with separation of concerns (Controllers, Services, Models, Middleware)

### **Infrastructure & DevOps**
- **Cloud Platform**: AWS Cloud Computing Services
- **Reverse Proxy**: Nginx with SSL/TLS termination and HTTP/2 support
- **Process Management**: PM2 with cluster mode support, auto-restart, graceful shutdown, and log rotation
- **Containerization**: Docker & Docker Compose for local development environment
- **Auto-Scaling**: EC2 Auto Scaling Groups configured (production-ready)
- **CI/CD**: GitHub Actions workflow for automated testing and deployment (configurable)

### **Security Features**
- **Authentication**: JWT tokens with configurable expiration (7 days default)
- **Password Security**: bcrypt hashing with 10 salt rounds
- **API Protection**: Rate limiting (configurable per environment), Helmet.js security headers
- **Input Validation**: Express-validator for comprehensive request validation
- **SQL Injection Prevention**: Parameterized queries via Sequelize ORM
- **HTTPS**: SSL/TLS encryption in production using Let's Encrypt
- **CORS**: Configurable Cross-Origin Resource Sharing policies

### **Database Design**
- **ORM**: Sequelize with automated migrations and seeders
- **Relationships**: Complex relational model (Users, Profiles, Goals, Connections, Activities, Posts, Notifications)
- **Performance**: Strategic database indexing on frequently queried columns
- **Data Integrity**: Foreign key constraints, cascade deletes, and transaction support
- **Seeding**: Faker.js integration for generating realistic test data at scale


### **Key Technical Decisions**
- **No Frontend Framework**: Vanilla JavaScript to demonstrate core web fundamentals and reduce bundle size
- **PostgreSQL over MongoDB**: Relational data with complex joins, ACID compliance, and better query performance
- **Monorepo Structure**: Separated frontend/backend directories for independent deployment and scaling
- **PM2 over Docker in Production**: Better resource control and monitoring on EC2 instances
- **Nginx Reverse Proxy**: Separation of static assets and API routing for improved scalability and caching

---

## Current Features

### Authentication System
- **Secure Registration**: JWT-based user registration with password validation
- **Login System**: Email/password authentication with bcrypt password hashing
- **Protected Routes**: JWT middleware for securing API endpoints
- **User Profiles**: Comprehensive user profile management with privacy settings

### Goal Management
- **Goal Tracking**: Set and monitor personal wellness goals
- **Progress Monitoring**: Track current progress vs target values
- **Goal Categories**: Weight loss, muscle gain, cardio, nutrition, etc.
- **Milestone System**: Break down goals into achievable milestones

### Database Management
- **pgAdmin Interface**: Web-based database management at `http://localhost:5050`
- **PostgreSQL**: Robust relational database with proper indexing
- **Migration System**: Automated database schema management
- **Database Seeding**: Generate fake data with Faker.js for testing and development
- **Auto-Accept Connections**: Seeded users automatically accept connection requests for better testing experience

---

## 🚀 Quick Start

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

### Start the Application
```bash
# Start the backend server
cd backend
node server.js
```

**Access URLs:**
- **Main App**: `http://localhost:3000`
- **pgAdmin**: `http://localhost:5050` (admin@fittedin.com / admin123)

---

## Documentation

### Getting Started
- [Quick Start Guide](docs/getting-started/QUICKSTART.md) - Get up and running in 5 minutes
- [Development Setup](docs/development/DEVELOPMENT.md) - Detailed development environment setup
- [Database Management](docs/development/DATABASE_MANAGEMENT.md) - pgAdmin usage guide

### Architecture
- [System Architecture](docs/architecture/ARCHITECTURE.md) - Technical architecture overview
- [Architecture Improvements](docs/architecture/ARCHITECTURE_IMPROVEMENT.md) - Future enhancements

### Features
- [Dashboard Features](docs/features/DASHBOARD_IMPROVEMENTS.md) - Dashboard personalization
- [Profile System](docs/features/PROFILE_DEMO.md) - User profile management
- [Authentication](docs/features/AUTH_FIX_SUMMARY.md) - Auth system documentation

### Deployment
- [Manual EC2 Deployment](docs/deployment/MANUAL_DEPLOYMENT.md) - **Deploy to EC2 using setup.sh (Current Method)**
- [AWS EC2 Deployment Guide](docs/deployment/AWS_EC2_DEPLOYMENT.md) - Complete production deployment guide
- [AWS RDS Setup](docs/deployment/AWS_RDS_SETUP.md) - PostgreSQL database configuration
- [SSL Certificate Setup](docs/deployment/SSL_SETUP.md) - Let's Encrypt SSL configuration
- [Monitoring & Alerting](docs/deployment/MONITORING_AND_ALERTING.md) - CloudWatch monitoring setup
- [Auto Scaling](docs/deployment/AUTO_SCALING.md) - EC2 Auto Scaling configuration
- [DevOps Guide](docs/deployment/DEVOPS_GUIDE.md) - CI/CD and DevOps documentation (GitHub Actions currently disabled)
- [CI/CD Pipeline](docs/deployment/CI_CD_PIPELINE.md) - GitHub Actions documentation (currently disabled)
- [Midterm Summary](docs/deployment/MIDTERM_SUMMARY.md) - Project progress summary
- [Presentation Checklist](docs/deployment/MIDTERM_PRESENTATION_CHECKLIST.md) - Demo preparation

**Note:** GitHub Actions workflows are currently **disabled**. Use `setup.sh` for manual deployment to EC2. See [Manual EC2 Deployment Guide](docs/deployment/MANUAL_DEPLOYMENT.md) for details.

---

## Testing

### API Testing
```bash
# Health check
curl http://localhost:3000/api/health

# Registration
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"displayName":"John Doe","email":"john@example.com","password":"Password123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"Password123"}'
```

### Database Testing
```bash
# Test pgAdmin setup
./test-pgadmin.sh

# Direct database access
docker-compose exec postgres psql -U postgres -d fittedin_dev
```

### Database Seeding
```bash
# Seed database with fake data (50 users, goals, posts, connections, etc.)
cd backend
npm run db:seed:faker

# Clear existing data and seed fresh data
npm run db:seed:clear

# Custom amounts
SEED_NUM_USERS=100 SEED_NUM_POSTS=300 npm run db:seed:faker
```

**Note:** All seeded users have password: `Password123!`

---

## Next Steps

### Phase 1: Connection System (Current Focus)
1. **User Discovery**: Implement user recommendation system
2. **Connection Management**: Send/accept/reject connection requests
3. **Social Features**: View connections' activities and progress

### Phase 2: Enhanced Features
1. **Activity Logging**: Record daily activities and progress
2. **Progress Visualization**: Charts and reports
3. **Community Support**: Group challenges and leaderboards

### Phase 3: Advanced Features
1. **Mobile Responsiveness**: Improve UI for mobile devices
2. **Real-time Notifications**: Connection updates and achievements
3. **Advanced Analytics**: Personalized insights and recommendations

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Convention
- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation changes
- `refactor:` code refactoring
- `test:` adding or updating tests

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Support

If you encounter any issues:

1. Check the [Troubleshooting](docs/development/DEVELOPMENT.md#common-issues) section
2. Review the logs: `docker-compose logs postgres`
3. Ensure all prerequisites are installed
4. Try running the setup script again: `./setup.sh`

---

## Contributors 👤

- Andrew Chen
- Haoyang Guo
- Kelvin Ihezue
- Carlos Ortiz
- Pendo Thiirah
- Dileep Kumar Vadlamudi
- Alaric Li
- Yixiao Xiao
- Adam Ashby

**Happy coding! 🚀**
