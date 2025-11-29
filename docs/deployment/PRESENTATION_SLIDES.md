# FittedIn Project Presentation Slides

> **Project:** FittedIn - Health & Wellness Networking Platform  
> **Course:** ECE 452 Software Engineering  
> **Team:** Chih-hung Chen, Haoyang Guo, Alaric Li, Yixiao Xiao, Adam Ashby, Carlos Ortiz, Kelvin Ihezue  
> **Semester:** Fall 2025

---

## 🎯 Pre-Presentation Checklist

### Before You Start (30 minutes before)
- [ ] Backend server running (`cd backend && node server.js`)
- [ ] Database connected and accessible
- [ ] Test account created with demo data
- [ ] Browser open at `http://localhost:3000`
- [ ] Browser DevTools open (F12) with Network tab visible
- [ ] All terminal windows/programs ready
- [ ] Slides prepared (PowerPoint, Keynote, or similar)
- [ ] Practice the demo flow at least once
- [ ] Have water nearby

### Demo Account Setup
```
Email: demo@fittedin.com
Password: Password123
Display Name: Demo User
```

### During Presentation
- Keep Browser DevTools open to show network requests
- Speak clearly and confidently
- If something fails, stay calm and continue
- Have backup screenshots ready
- Make eye contact with audience

---

## Slide 1: Project Introduction

### Title: "FittedIn - Health & Wellness Networking Platform"

**Content:**

#### The Problem
- Most health apps are **data-driven** but lack **community**
- Users lose motivation without social accountability
- Isolated tracking doesn't build lasting habits

#### Our Solution
- **FittedIn** reimagines health tracking as a **social networking experience**
- Inspired by LinkedIn for the wellness community
- Focus on **connections, accountability, and shared progress**
- Transform isolated health efforts into **collaborative journeys**

#### Core Concept
> "LinkedIn for Health & Wellness"

---

## Slide 2: Tech Stack Overview

### Title: "Technology Stack"

**Backend:**
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **PostgreSQL** - Relational database
- **Sequelize ORM** - Database abstraction layer
- **JWT** - Stateless authentication
- **bcrypt** - Password hashing

**Frontend:**
- **Vanilla JavaScript** - No framework dependencies
- **HTML5 / CSS3** - Semantic markup and modern styling
- **Responsive Design** - Works on all devices

**Development Tools:**
- **Docker** - Containerized database
- **pgAdmin** - Database management interface
- **Git** - Version control

**Why This Stack?**
- Industry-standard technologies
- Excellent documentation
- Course requirement (Vanilla JS)
- Demonstrates fundamental understanding

---

## Slide 3: System Architecture

### Title: "Architecture Overview"

**Three-Tier Architecture:**

```
┌─────────────────────────────────────────┐
│     Presentation Layer                  │
│  (HTML + CSS + Vanilla JavaScript)      │
└─────────────────┬───────────────────────┘
                  │
            REST API (JSON)
                  │
┌─────────────────┴───────────────────────┐
│     Application Layer                   │
│  (Node.js + Express + Sequelize)        │
│  - Routes → Controllers → Services      │
│  - Authentication & Authorization       │
│  - Business Logic                       │
└─────────────────┬───────────────────────┘
                  │
             SQL Queries
                  │
┌─────────────────┴───────────────────────┐
│     Data Layer                          │
│  (PostgreSQL Database)                  │
└─────────────────────────────────────────┘
```

**Key Architectural Patterns:**
- **MVC Pattern** - Clear separation of concerns
- **Service Layer** - Business logic separation
- **Middleware** - Authentication and error handling
- **RESTful API** - Standard HTTP methods

**Code Organization:**
```
backend/src/
├── controllers/    # Request/response handling
├── services/       # Business logic
├── models/         # Database models
├── routes/         # API endpoints
├── middleware/     # Auth & error handling
└── utils/          # Helper functions
```

---

## Slide 4: Core Features Implemented

### Title: "Implemented Features"

#### ✅ 1. Authentication System
- User registration with email/password
- Secure login with JWT tokens
- Password hashing with bcrypt (10 rounds)
- Protected routes with middleware
- Session persistence across pages

#### ✅ 2. Profile Management
- Complete user profiles with:
  - Basic info (pronouns, location, bio)
  - Physical attributes (height, weight, BMI)
  - Skills & expertise tags
  - Wellness goals
  - Privacy settings
- Profile completion tracking
- Real-time editing and updates
- Modern, responsive UI

#### ✅ 3. Goals Management
- Create, edit, and delete goals
- Track progress (current vs target values)
- Goal categories (Cardio, Strength, Nutrition, etc.)
- Progress visualization with progress bars
- Status tracking (Active, Completed, Paused)
- Filter functionality
- Demo data loading

#### ✅ 4. Dashboard
- User overview and welcome
- Quick navigation to features
- Logout functionality
- Clean, intuitive design

**Status:** Core MVP features complete and fully functional

---

## Slide 5: Demo - Authentication

### Title: "🔐 Authentication Flow"

**Live Demo: 2 minutes**

#### **1. Registration** (45 seconds)
- Navigate to homepage → "Get Started"
- Register: `demo@fittedin.com` / `Password123`
- Auto-login → redirect to Dashboard
- Show: JWT token in localStorage (DevTools)

#### **2. Login** (30 seconds)
- Logout → Login page
- Enter credentials
- Show: Network request with JWT token
- Navigate to protected pages

#### **3. Protected Routes** (45 seconds)
- Navigate: Dashboard → Profile → Goals
- Demonstrate: Auth check on each page
- Show: `Authorization: Bearer <token>` in headers

**Technical Highlights:**
- JWT authentication (7-day expiration)
- bcrypt password hashing (10 rounds)
- Stateless session management
- Protected API endpoints

---

## Slide 6: Demo - Profile Management

### Title: "👤 Profile Management"

**Live Demo: 3-4 minutes**

#### **1. Profile Overview** (30 seconds)
- Navigate to Profile page
- Show: Completion score and progress bar
- Show: Tabbed interface (Overview, Goals, Activity, Settings)

#### **2. Edit Profile** (2 minutes)
- **Basic Info:** Pronouns, Location, Bio (Toronto, Canada)
- **Physical:** Height 175cm, Weight 70kg, Fitness Level: Intermediate
- **Skills:** Add Running, Yoga, Nutrition (stored as JSON)
- **Highlight:** Auto-calculated BMI
- Show: Instant UI update after save

#### **3. Privacy Settings** (30 seconds)
- Switch to Settings tab
- Toggle: Profile visibility, Show activity, Show goals
- Explain: Granular control over data visibility

**Technical Highlights:**
- Inline editing with modal forms
- Automatic BMI calculation
- JSON fields for flexible data (skills, goals)
- Profile completion algorithm
- RESTful API: `PUT /api/profiles/:userId`

---

## Slide 7: Demo - Goals Management

### Title: "🎯 Goals Management"

**Live Demo: 3-4 minutes**

#### **1. Load Demo Data** (30 seconds)
- Navigate to Goals page
- Click "Load Demo Data"
- Show: 3 goals with progress bars and status badges

#### **2. Create Goal** (1 minute)
- Click "Create Goal"
- Fill: "Complete 10km Run" / Cardio / Target: 10 km / Priority: High / Public
- Save and show in list

#### **3. Update Progress** (1 minute)
- Select goal → "Update Progress"
- Update current value: 5 km
- **Highlight:** Progress bar animates to 50%
- Show: Percentage calculation

#### **4. Filter & Edit** (1 minute)
- Filter by "Active" status
- Edit goal: Change priority or deadline
- Show: Real-time UI update
- Delete goal (with confirmation)

**Visual Elements:**
- Color-coded status (Blue=Active, Green=Completed, Gray=Paused)
- Progress bars with animations
- Category badges and priority indicators

**Technical Highlights:**
- Full CRUD operations
- Progress formula: `(current_value / target_value) × 100`
- RESTful API: `GET/POST/PUT/DELETE /api/goals`
- Status-based filtering
- ENUM types for data integrity

---

## Slide 8: Database Schema - Detailed Design

### Title: "Database Architecture & Design"

**Entity Relationship Diagram:**

```
┌──────────────────────┐         ┌──────────────────────┐
│       User           │◄────────│      Profile         │
│  (Authentication)    │  1:1    │  (User Information)  │
│                      │         │                      │
│ - id (PK)            │         │ - id (PK)            │
│ - email (unique)     │         │ - user_id (FK)       │
│ - password_hash      │         │ - pronouns           │
│ - display_name       │         │ - bio                │
│ - avatar_url         │         │ - location           │
│ - created_at         │         │ - date_of_birth      │
│ - updated_at         │         │ - height, weight     │
└──────────┬───────────┘         │ - fitness_level      │
           │                     │ - primary_goals      │
           │ 1                   │ - skills (JSON)      │
           │                     │ - privacy_settings   │
           │                     └──────────────────────┘
           │
           │ *  (One-to-Many)
           │
┌──────────┴───────────┐
│       Goal           │
│  (Wellness Goals)    │
│                      │
│ - id (PK)            │
│ - user_id (FK)       │
│ - title              │
│ - description        │
│ - category (ENUM)    │
│ - target_value       │
│ - current_value      │
│ - unit               │
│ - start_date         │
│ - target_date        │
│ - status (ENUM)      │
│ - priority (ENUM)    │
│ - is_public          │
│ - milestones (JSON)  │
│ - notes              │
└──────────────────────┘
```

**Detailed Table Schemas:**

#### 1. Users Table (Core Authentication)
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,      -- bcrypt hashed
    display_name VARCHAR(100) NOT NULL,       -- 2-100 chars
    avatar_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

Indexes: email (unique constraint)
```

**Key Features:**
- Primary authentication table
- Password auto-hashed via Sequelize hooks
- Email validation and uniqueness
- Cascade deletion triggers profile/goal deletion

#### 2. Profiles Table (User Information)
```sql
CREATE TABLE profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pronouns VARCHAR(50),
    bio TEXT,                                  -- Max 1000 chars
    location VARCHAR(100),
    date_of_birth DATE,
    height INTEGER,                            -- Centimeters
    weight DECIMAL(5,2),                       -- Kilograms
    fitness_level ENUM('beginner', 'intermediate', 'advanced'),
    primary_goals JSON DEFAULT '[]',           -- Array of goal categories
    skills JSON DEFAULT '[]',                  -- Array of wellness skills
    privacy_settings JSON DEFAULT '{           -- Privacy configuration
        "profile_visibility": "public",
        "show_activity": true,
        "show_goals": true,
        "show_connections": true
    }',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

Constraints: user_id UNIQUE (1:1 relationship)
```

**Key Features:**
- One-to-one relationship with Users
- JSON fields for flexible data storage (skills, goals)
- Privacy settings for granular control
- Auto-deleted when user is deleted (CASCADE)

#### 3. Goals Table (Wellness Goals)
```sql
CREATE TABLE goals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,               -- Goal name
    description TEXT,
    category ENUM(                             -- Goal type
        'weight_loss', 'weight_gain', 'muscle_gain', 'cardio',
        'flexibility', 'nutrition', 'mental_health', 'sleep',
        'hydration', 'other'
    ) DEFAULT 'other',
    target_value DECIMAL(10,2) NOT NULL,       -- Goal target
    current_value DECIMAL(10,2) DEFAULT 0,     -- Current progress
    unit VARCHAR(50) NOT NULL DEFAULT 'units', -- Measurement unit
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    target_date DATE,                          -- Optional deadline
    status ENUM('active', 'completed', 'paused', 'cancelled') DEFAULT 'active',
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    is_public BOOLEAN DEFAULT true,            -- Share with network
    milestones JSON DEFAULT '[]',              -- Milestone tracking
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

Indexes:
    - idx_goals_user_id ON goals(user_id)
    - idx_goals_status ON goals(status)
    - idx_goals_category ON goals(category)
```

**Key Features:**
- One-to-many relationship with Users
- Multiple ENUM fields for data integrity
- Built-in instance methods (getProgressPercentage, isOverdue)
- Indexed queries for performance
- CASCADE deletion (user → goals)

**Database Design Principles:**

1. **Referential Integrity**
   - Foreign keys with CASCADE delete
   - Unique constraints prevent duplicates
   - NOT NULL on required fields

2. **Data Validation**
   - Sequelize validators (length, email, URL)
   - ENUM types for fixed value sets
   - Automatic password hashing via hooks

3. **Performance Optimization**
   - Indexed foreign keys (user_id)
   - Indexed filtered fields (status, category)
   - Efficient JSON storage for flexible data

4. **Scalability**
   - JSON fields allow schema evolution without migrations
   - Indexed queries support large datasets
   - Proper data types prevent overflow

5. **Data Integrity**
   - ACID compliance with PostgreSQL
   - Cascade deletes maintain consistency
   - Timestamps auto-managed

---

## Slide 9: Security & Performance

### Title: "Security & Performance Considerations"

**Security Implementations:**

1. **Password Security**
   - bcrypt hashing (10 salt rounds)
   - Never store plain text passwords
   - Follows OWASP best practices

2. **Authentication**
   - JWT token expiration (7 days)
   - Secure token storage (localStorage)
   - Protected routes middleware

3. **API Security**
   - Input validation with express-validator
   - SQL injection prevention (Sequelize)
   - XSS protection
   - Error handling without exposing internals

**Performance Optimizations:**

1. **Database**
   - Indexed foreign keys
   - Efficient queries with Sequelize
   - Connection pooling

2. **API**
   - RESTful design
   - Minimal payload sizes
   - Efficient data fetching

3. **Frontend**
   - Vanilla JS (no framework overhead)
   - Minimal bundle size
   - Fast initial load

---

## Slide 10: Future Roadmap

### Title: "Next Steps & Future Plans"

**Phase 1: Social Features (Next Sprint)**
- User discovery and search
- Connection requests (send/accept/reject)
- View connections' profiles
- Connection recommendations

**Phase 2: Activity Tracking**
- Daily activity logging
- Progress visualization
- Activity history
- Statistics and analytics

**Phase 3: Community Features**
- News feed with posts
- Social interactions (likes, comments)
- Group challenges
- Leaderboards

**Phase 4: Advanced Features**
- Mobile app (React Native)
- Real-time notifications
- Third-party integrations (Fitbit, Strava)
- Personalized insights
- AI-powered recommendations

**Long-term Vision:**
- Become the "LinkedIn for wellness professionals"
- Build a community-driven platform
- Expand to iOS and Android
- Add professional networking features

---

## Slide 11: Lessons Learned & Challenges

### Title: "Project Insights"

**Key Learnings:**

1. **Architecture Matters**
   - Service layer separation improves maintainability
   - Clear MVC pattern makes code easier to understand
   - Modular design enables parallel development

2. **Authentication Complexity**
   - JWT implementation requires careful consideration
   - Session persistence across pages was a challenge
   - Token refresh strategy needed for production

3. **Database Design**
   - Relationship modeling requires planning
   - Foreign keys ensure data integrity
   - Migrations essential for team collaboration

**Challenges Overcome:**

1. ✅ **Authentication State Management**
   - Implemented centralized auth state
   - Fixed script path issues
   - Maintained session across navigation

2. ✅ **Code Organization**
   - Refactored from flat structure to layered architecture
   - Separated concerns (Routes → Controllers → Services)
   - Improved testability

3. ✅ **UI/UX Design**
   - Created modern, professional interface
   - Implemented responsive design
   - Added visual feedback and loading states

**Team Collaboration:**
- Git feature branch workflow
- Clear role division
- Regular code reviews
- Effective communication

---

## Slide 12: Conclusion

### Title: "Thank You"

**What We Built:**
- ✅ Complete authentication system
- ✅ Comprehensive profile management
- ✅ Full goals tracking system
- ✅ Modern, responsive UI
- ✅ Scalable architecture

**Key Achievements:**
- 90%+ feature completeness
- Enterprise-level architecture
- Clean, maintainable codebase
- Production-ready security
- Comprehensive documentation

**Technology Demonstrated:**
- Full-stack JavaScript development
- RESTful API design
- Relational database design
- User authentication and authorization
- Frontend state management

**Questions?**

---

## Presentation Tips

### Recommended Timing (10-12 minutes total)
- **Slides 1-3:** 2 minutes (Introduction, Stack, Architecture)
- **Slide 4:** 1 minute (Core Features Overview)
- **Slides 5-7:** 6 minutes (**Live Demos**)
  - Auth Demo: 2 minutes
  - Profile Demo: 2 minutes
  - Goals Demo: 2 minutes
- **Slide 8:** 1-2 minutes (Database Schema)
- **Slide 9:** 30 seconds (Security & Performance)
- **Slides 10-12:** 1 minute (Future, Learnings, Conclusion)

### Demo Strategy
1. **Prepare test account** before presentation
   - Email: demo@fittedin.com
   - Password: Password123
   - Complete profile with demo data
   - Create 2-3 sample goals
2. **Test complete flow** 2-3 times beforehand
   - Practice each demo section
   - Time each part to stay within limits
   - Know exactly what to click and say
3. **Have backup plan** (screenshots if live demo fails)
   - Screenshot key screens (Profile page, Goals with progress, etc.)
   - Video recording of demo flow as backup
4. **Practice transitions** between slides and demo
   - Smooth handoff from slide to browser
   - Know keyboard shortcuts (Alt+Tab to switch windows)
5. **Keep demo smooth** - know exactly what to click
   - Pre-fill forms or use autocomplete
   - Have test data ready
   - Know which buttons/icons to click

### Best Practices
- Start with the problem, then show solution
- Emphasize technical depth and architecture
- Be honest about what's implemented vs. planned
- Show enthusiasm for the project
- Be prepared to answer questions confidently

### Common Questions
- **"Why Vanilla JS?"** → Course requirement, demonstrates fundamentals
- **"Why PostgreSQL?"** → Relational data, ACID compliance, complex queries
- **"How scalable?"** → Designed for horizontal scaling with Nginx
- **"Security concerns?"** → bcrypt, JWT, input validation, Sequelize protection

---

## 🎯 Quick Demo Reference Card

**Test Credentials:**
```
Email: demo@fittedin.com
Password: Password123
```

**Auth Demo (2 min):**
1. Register → auto-login
2. Login with credentials
3. Navigate pages with auth check

**Profile Demo (2 min):**
1. Edit: Location, Bio, Physical info
2. Add skills: Running, Yoga, Nutrition
3. Show BMI calculation
4. Privacy settings

**Goals Demo (2 min):**
1. Load demo data
2. Create: "10km Run" goal
3. Update progress: 5km → 50%
4. Filter by status
5. Edit and delete

**Key Talking Points:**
- JWT authentication, bcrypt hashing
- RESTful API design
- Database relationships (User → Profile, User → Goals)
- JSON fields for flexible data
- ENUM types for data integrity

---

**Good luck with your presentation! 🚀**
