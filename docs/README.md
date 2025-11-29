# 📚 FittedIn Documentation

Welcome to the FittedIn documentation! This directory contains all project documentation organized by category.

---

## 📁 Directory Structure

```
docs/
├── getting-started/     # Quick start guides
├── development/         # Development guides and tools
├── features/           # Feature documentation
├── architecture/       # System architecture
└── deployment/         # Deployment and presentation guides
```

---

## 🏃‍♂️ Getting Started

**New to the project? Start here!**

- [**Quick Start Guide**](getting-started/QUICKSTART.md) - Get up and running in 5 minutes
  - Prerequisites check
  - One-command setup
  - Basic testing

---

## 🛠️ Development

**For developers working on the project**

- [**Development Guide**](development/DEVELOPMENT.md) - Complete development environment setup
  - Local development setup
  - Project structure
  - Development workflow
  - Testing procedures
  - Common issues and solutions

- [**Database Management**](development/DATABASE_MANAGEMENT.md) - pgAdmin usage guide
  - Connecting to database
  - Common SQL queries
  - Database operations
  - Troubleshooting

- [**Database Seeding**](../backend/scripts/SEEDING_README.md) - Generate fake data with Faker.js
  - Seeding script usage
  - Configuration options
  - Generated data details

---

## 🎨 Features

**Feature-specific documentation**

- [**Dashboard Features**](features/DASHBOARD_IMPROVEMENTS.md) - Dashboard personalization features
- [**Profile System**](features/PROFILE_DEMO.md) - User profile management system
- [**Authentication**](features/AUTH_FIX_SUMMARY.md) - Authentication system documentation
- [**UI Beautification**](features/BEAUTIFICATION_REPORT.md) - UI improvements and styling
- [**Auto-Accept Connections**](features/AUTO_ACCEPT_CONNECTIONS.md) - Automatic connection acceptance for seeded users

---

## 🏗️ Architecture

**System design and technical architecture**

- [**System Architecture**](architecture/ARCHITECTURE.md) - Complete technical architecture overview
  - System overview
  - Architecture layers
  - Data model
  - API design
  - Design decisions
  - Performance considerations

- [**Architecture Improvements**](architecture/ARCHITECTURE_IMPROVEMENT.md) - Future architecture enhancements
  - Scalability plans
  - Performance optimizations
  - Technology upgrades

---

## 🚀 Deployment

**Deployment and presentation guides**

- [**Midterm Summary**](deployment/MIDTERM_SUMMARY.md) - Project progress and completed features
- [**Presentation Checklist**](deployment/MIDTERM_PRESENTATION_CHECKLIST.md) - Demo preparation checklist
- [**Push Preparation**](deployment/PREPARE_FOR_PUSH.md) - Pre-deployment checklist
- [**Push Checklist**](deployment/PUSH_CHECKLIST.md) - Final deployment checklist

---

## 📋 Documentation Summary

- [**Documentation Overview**](DOCUMENTATION_SUMMARY.md) - Complete documentation index

---

## 🔍 Quick Reference

### Essential Commands
```bash
# Setup
./setup.sh

# Start development
cd backend && node server.js

# Database management
docker-compose up -d
# Access pgAdmin: http://localhost:5050

# Testing
./test-pgadmin.sh
```

### Key URLs
- **Main App**: http://localhost:3000
- **pgAdmin**: http://localhost:5050
- **API**: http://localhost:3000/api

### Important Files
- **Main README**: [../README.md](../README.md)
- **Docker Config**: [../docker-compose.yml](../docker-compose.yml)
- **Setup Script**: [../setup.sh](../setup.sh)

---

## 📝 Contributing to Documentation

When adding new documentation:

1. **Choose the right directory** based on content type
2. **Follow naming conventions** (UPPERCASE_WITH_UNDERSCORES.md)
3. **Update this index** if adding new categories
4. **Cross-reference** related documents
5. **Keep it concise** and well-structured

---

**Need help?** Check the [Development Guide](development/DEVELOPMENT.md) or create an issue!
