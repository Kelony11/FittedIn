# Architecture Documentation

This document provides detailed information about FittedIn's system architecture, data models, and design decisions.

---

## 📋 Table of Contents

- [System Overview](#system-overview)
- [Architecture Layers](#architecture-layers)
- [Data Model](#data-model)
- [API Design](#api-design)
- [Design Decisions](#design-decisions)

---

## System Overview

FittedIn follows a three-tier architecture pattern with environment-specific variations:

### Development (MVP / Local)
```scss
┌─────────────────────────────────────────────────────────┐
│                    Presentation Layer                    │
│            (HTML + CSS + Vanilla JavaScript)             │
└─────────────────────────────────────────────────────────┘
                            │
                    REST API (JSON)
                            │
┌─────────────────────────────────────────────────────────┐
│                     Application Layer                    │
│        (Node.js + Express.js + Sequelize ORM)            │
│   - Serves static frontend files (index.html, JS, CSS)   │
│   - Hosts backend API endpoints                          │
└─────────────────────────────────────────────────────────┘
                            │
                      SQL Queries
                            │
┌─────────────────────────────────────────────────────────┐
│                       Data Layer                         │
│                     (PostgreSQL)                         │
└─────────────────────────────────────────────────────────┘
```


- Frontend is bundled into /frontend/public and directly served by the Express backend.

- Keeps same-origin requests → no CORS issues.

- Simpler to run locally with just two npm installs (frontend/ + backend/).

### Production (Deployment / Scaling)

```scss
┌─────────────────────────────────────────────────────────┐
│                      Nginx Reverse Proxy                 │
│   - Serves frontend static files (HTML, JS, CSS)         │
│   - Handles TLS/HTTPS and HTTP/2                         │
│   - Reverse-proxies /api requests to Node.js backend     │
│   - Adds caching, compression, and rate limiting         │
└─────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│                     Application Layer                    │
│              (Node.js + Express.js + Sequelize)          │
│   - Purely API-focused in production                     │
└─────────────────────────────────────────────────────────┘
                            │
                      SQL Queries
                            │
┌─────────────────────────────────────────────────────────┐
│                       Data Layer                         │
│                     (PostgreSQL)                         │
└─────────────────────────────────────────────────────────┘
```

- Nginx serves static frontend assets and proxies API requests to backend.

- Backend focuses on REST APIs only (no static serving).

- Easier scaling (multiple backend containers behind Nginx).

- Enables advanced features: CDN, Redis caching, HTTPS termination.

---

## Architecture Layers

### 1. Presentation Layer (Frontend)

**Technology:** Vanilla JavaScript, HTML5, CSS3

**Responsibilities:**
- Render user interface
- Handle user interactions
- Make API calls to backend
- Client-side form validation
- Data visualization (Chart.js)

**Key Components:**
- `index.html` — Landing page
- `profile.html` — User profile management
- `goals.html` — Goal setting and tracking
- `feed.html` — Social feed and posts
- `connections.html` — Network management

### 2. Application Layer (Backend)

**Technology:** Node.js v20+, Express.js, Sequelize ORM

**Responsibilities:**
- Handle HTTP requests
- Business logic execution
- Authentication and authorization
- Data validation
- Database operations via ORM

**Key Modules:**

```
/backend/src
├── /routes         # HTTP endpoint definitions
├── /controllers    # Business logic
├── /models         # Sequelize ORM models
├── /middleware     # Express middleware (auth, validation, etc.)
└── /services       # Reusable business services
```

### 3. Data Layer (Database)

**Technology:** PostgreSQL 14+

**Responsibilities:**
- Persistent data storage
- Data integrity enforcement
- Complex queries and aggregations
- Transaction management

---

## Data Model

### Entity Relationship Diagram

```
┌─────────────┐         ┌──────────────┐
│    User     │◄───────►│   Profile    │
└─────────────┘         └──────────────┘
      │ 1                      
      │                        
      │ *                      
┌─────────────┐         ┌──────────────┐
│    Goal     │         │ ActivityLog  │
└─────────────┘         └──────────────┘
      │ *                      │ *
      └────────────────────────┘
               
┌─────────────┐         ┌──────────────┐
│ Connection  │         │     Post     │
│ (self-ref)  │         │              │
└─────────────┘         └──────────────┘
      │ *                      │ *
      │                        │
      └────────►User◄──────────┘
```

### Database Schema

#### **User Table**

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

**Fields:**
- `id` — Unique user identifier
- `email` — User's email (login credential)
- `password_hash` — Bcrypt hashed password
- `display_name` — Public display name
- `avatar_url` — Profile picture URL
- `created_at` — Account creation timestamp
- `updated_at` — Last modification timestamp

---

#### **Profile Table**

```sql
CREATE TABLE profiles (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    pronouns VARCHAR(50),
    bio TEXT,
    location VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Fields:**
- `user_id` — Foreign key to users table (1:1 relationship)
- `pronouns` — User's preferred pronouns
- `bio` — Profile description
- `location` — User's location

---

#### **Goal Table**

```sql
CREATE TABLE goals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    target_value DECIMAL(10, 2) NOT NULL,
    current_value DECIMAL(10, 2) DEFAULT 0,
    unit VARCHAR(50) NOT NULL,
    due_date DATE,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Fields:**
- `id` — Unique goal identifier
- `user_id` — Goal owner
- `title` — Goal name (e.g., "Run 5km")
- `target_value` — Target amount (e.g., 5)
- `current_value` — Current progress
- `unit` — Measurement unit (e.g., "km", "lbs")
- `due_date` — Optional deadline
- `status` — active | completed | abandoned

---

#### **ActivityLog Table**

```sql
CREATE TABLE activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    goal_id INTEGER REFERENCES goals(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    notes TEXT,
    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Fields:**
- `id` — Unique activity identifier
- `user_id` — Activity owner
- `goal_id` — Associated goal (optional)
- `type` — Activity type (e.g., "running", "meal")
- `amount` — Activity amount
- `unit` — Measurement unit
- `logged_at` — When the activity occurred

---

#### **Connection Table**

```sql
CREATE TABLE connections (
    id SERIAL PRIMARY KEY,
    requester_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    addressee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(requester_id, addressee_id)
);
```

**Fields:**
- `id` — Unique connection identifier
- `requester_id` — User who sent the request
- `addressee_id` — User who received the request
- `status` — pending | accepted | rejected

---

#### **Post Table**

```sql
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    image_url VARCHAR(500),
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Fields:**
- `id` — Unique post identifier
- `user_id` — Post author
- `content` — Post text content
- `image_url` — Optional image attachment
- `likes_count` — Cached like count

---

#### **Report Table**

```sql
CREATE TABLE reports (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    summary_json JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Fields:**
- `id` — Unique report identifier
- `user_id` — Report owner
- `period_start` — Report period start date
- `period_end` — Report period end date
- `summary_json` — JSON object containing stats and charts

---

## API Design

### RESTful Endpoints

#### Authentication
- `POST /api/auth/register` — Register new user
- `POST /api/auth/login` — User login
- `POST /api/auth/logout` — User logout

#### Users & Profiles
- `GET /api/users/:id` — Get user profile
- `PUT /api/users/:id` — Update user profile
- `GET /api/users/:id/goals` — Get user's goals
- `GET /api/users/:id/activities` — Get user's activities

#### Goals
- `GET /api/goals` — List all goals (with filters)
- `POST /api/goals` — Create new goal
- `GET /api/goals/:id` — Get goal details
- `PUT /api/goals/:id` — Update goal
- `DELETE /api/goals/:id` — Delete goal

#### Activities
- `POST /api/activities` — Log new activity
- `GET /api/activities` — List activities (with filters)
- `PUT /api/activities/:id` — Update activity
- `DELETE /api/activities/:id` — Delete activity

#### Connections
- `POST /api/connections` — Send connection request
- `GET /api/connections` — List connections
- `PUT /api/connections/:id` — Accept/reject request
- `DELETE /api/connections/:id` — Remove connection

#### Posts
- `POST /api/posts` — Create new post
- `GET /api/posts` — Get feed (paginated)
- `POST /api/posts/:id/like` — Like a post
- `POST /api/posts/:id/comment` — Comment on post

#### Reports
- `GET /api/reports` — Get user reports
- `POST /api/reports/generate` — Generate new report

---

## Design Decisions

### 1. Why No Frontend Framework?

**Decision:** Use Vanilla JavaScript instead of React/Vue

**Rationale:**
- Course requirement
- Demonstrates fundamental understanding
- Reduces complexity and bundle size
- Faster initial load time

### 2. PostgreSQL vs MongoDB

**Decision:** PostgreSQL (relational database)

**Rationale:**
- Structured data with clear relationships
- ACID compliance for data integrity
- Better support for complex queries and joins
- Team familiarity with SQL

### 3. Sequelize ORM

**Decision:** Use Sequelize instead of raw SQL

**Rationale:**
- Automatic migration management
- Type safety and validation
- Easier to maintain and refactor
- Protection against SQL injection

### 4. JWT Authentication

**Decision:** JWT tokens for authentication

**Rationale:**
- Stateless authentication
- Easy to scale horizontally
- Works well with REST APIs
- Industry standard

### 5. Monorepo Structure

**Decision:** Separate frontend and backend directories

**Rationale:**
- Clear separation of concerns
- Independent deployment
- Easier to work in parallel
- Can scale to microservices later

---

## Performance Considerations

### Database Indexing

```sql
-- Improve query performance
CREATE INDEX idx_goals_user_id ON goals(user_id);
CREATE INDEX idx_activities_user_id ON activity_logs(user_id);
CREATE INDEX idx_activities_logged_at ON activity_logs(logged_at);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
```

### Caching Strategy

- Cache user profiles in memory (Redis in production)
- Cache aggregated reports for 1 hour
- Use ETags for static assets

### API Rate Limiting

```javascript
// Example middleware
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

---

## Security Considerations

1. **Password Security**
   - Bcrypt with salt rounds = 10
   - Minimum password length: 8 characters

2. **SQL Injection Prevention**
   - Use Sequelize parameterized queries
   - Never concatenate user input into SQL

3. **XSS Prevention**
   - Sanitize user input
   - Use Content Security Policy headers

4. **CSRF Protection**
   - CSRF tokens for state-changing operations
   - SameSite cookie attribute

5. **API Security**
   - JWT token expiration (7 days)
   - HTTPS only in production
   - Rate limiting

---

## Scalability Plan

### Phase 1 (MVP)
- Single server deployment
- PostgreSQL on same machine
- ~1000 concurrent users

### Phase 2 (Growth)
- Separate database server
- Redis cache layer
- CDN for static assets
- Load balancer
- ~10,000 concurrent users

### Phase 3 (Scale)
- Database read replicas
- Microservices architecture
- Message queue (RabbitMQ)
- Horizontal scaling
- ~100,000+ concurrent users

---

For development setup and workflow, see [DEVELOPMENT.md](DEVELOPMENT.md).