# Database Seeding with Faker.js

This directory contains scripts for seeding the FittedIn database with fake data using [@faker-js/faker](https://fakerjs.dev/).

## Scripts

### `seedDatabase.js`
Comprehensive seeding script that generates fake data for all database models:
- Users with profiles
- Goals
- Connections
- Posts, Post Likes, and Post Comments
- Activities
- Notifications

## Usage

### Basic Seeding
Seed the database with default amounts:
```bash
npm run db:seed:faker
```

### Clear and Seed
Clear all existing data and seed fresh data:
```bash
npm run db:seed:clear
```

### Custom Configuration
You can customize the amount of data generated using environment variables:

```bash
SEED_NUM_USERS=100 \
SEED_NUM_CONNECTIONS=200 \
SEED_NUM_POSTS=300 \
SEED_NUM_POST_LIKES=500 \
SEED_NUM_COMMENTS=400 \
SEED_NUM_ACTIVITIES=300 \
SEED_NUM_NOTIFICATIONS=250 \
SEED_CLEAR=true \
node scripts/seedDatabase.js
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SEED_NUM_USERS` | 50 | Number of users to create |
| `SEED_NUM_CONNECTIONS` | 100 | Number of connections to create |
| `SEED_NUM_POSTS` | 150 | Number of posts to create |
| `SEED_NUM_POST_LIKES` | 300 | Number of post likes to create |
| `SEED_NUM_COMMENTS` | 200 | Number of post comments to create |
| `SEED_NUM_ACTIVITIES` | 200 | Number of activities to create |
| `SEED_NUM_NOTIFICATIONS` | 150 | Number of notifications to create |
| `SEED_CLEAR` | false | If 'true', clears all existing data before seeding |

## Generated Data Details

### Users
- Realistic names and emails
- All users have password: `Password123!`
- Random avatar URLs

### Profiles
- Pronouns, bio, location
- Date of birth (ages 18-70)
- Height (150-200 cm) and weight (50-120 kg)
- Fitness levels: beginner, intermediate, advanced
- Random primary goals and wellness skills
- Privacy settings

### Goals
- 1-5 goals per user
- Realistic goal categories with appropriate units
- Progress tracking (current vs target values)
- Various statuses: active, completed, paused, cancelled
- Milestones and notes

### Connections
- Random connections between users
- **70% are accepted** - This ensures users can see each other's posts in their feed
- Remaining 30% are pending, rejected, or blocked
- No duplicate or self-connections

### Posts
- Fitness-themed content
- Realistic post templates
- Distributed across users

### Post Interactions
- Likes and comments on posts
- No duplicate likes
- Realistic comment content

### Activities
- Various activity types (goal_created, goal_updated, profile_updated, etc.)
- Linked to related entities (goals, connections, profiles)

### Notifications
- Various notification types
- Linked to related entities
- Some marked as read
- Realistic titles and messages

## Notes

- All seeded users have the same password: `Password123!`
- The script maintains referential integrity
- Duplicate entries are handled gracefully
- The script provides progress updates during execution
- A summary is displayed at the end

## Example Output

```
🌱 Starting database seeding...

📊 Configuration:
   Users: 50
   Connections: 100
   Posts: 150
   Post Likes: 300
   Post Comments: 200
   Activities: 200
   Notifications: 150

✅ Database connection established.

📝 Creating 50 users...
✅ Created 50 users

👤 Creating profiles for 50 users...
✅ Created 50 profiles

🎯 Creating goals for users...
✅ Created 125 goals

🤝 Creating 100 connections...
✅ Created 100 connections

📮 Creating 150 posts...
✅ Created 150 posts

❤️  Creating 300 post likes...
✅ Created 300 post likes

💬 Creating 200 post comments...
✅ Created 200 post comments

📊 Creating 200 activities...
✅ Created 200 activities

🔔 Creating 150 notifications...
✅ Created 150 notifications

==================================================
✅ Database seeding completed successfully!
==================================================

📊 Summary:
   Users: 50
   Profiles: 50
   Goals: 125
   Connections: 100
   Posts: 150
   Post Likes: 300
   Post Comments: 200
   Activities: 200
   Notifications: 150

💡 Note: All seeded users have password: Password123!
```

