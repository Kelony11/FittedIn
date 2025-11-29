# Dynamic Content Generation Guide

## Overview

The dynamic content generation system automatically creates new posts, goal updates, activities, and interactions from seeded users to make the website appear active and vibrant. This simulates real user activity and keeps the feed fresh.

## Features

The system generates various types of content:

1. **New Posts** (50% probability)
   - Fitness-themed posts with realistic content
   - Timestamps within the last 1-24 hours
   - From randomly selected seeded users

2. **Goal Progress Updates** (20% probability)
   - Updates progress on active goals
   - Creates activity records
   - May complete goals if target is reached

3. **Post Interactions** (20% probability)
   - Likes on recent posts
   - Comments on posts
   - From users other than the post author

4. **Connection Requests** (10% probability)
   - New connection requests between seeded users
   - Auto-accepted if recipient is a seeded user

## Configuration

### Environment Variables

Set these in your `.env` file or environment:

```bash
# Enable/disable dynamic content generation (default: true)
ENABLE_DYNAMIC_CONTENT=true

# Minimum content items per run (default: 5)
MIN_CONTENT_PER_RUN=5

# Maximum content items per run (default: 15)
MAX_CONTENT_PER_RUN=15
```

### Prerequisites

- Seeded users must exist in the database (users with email domain `@fittedin-seeded.com`)
- Run the seeding script first: `npm run db:seed:faker`

## Usage

### Connect Real Users to Fake Users (Important!)

Before real users can see fake user content in their feed, you need to establish connections:

```bash
cd backend
npm run connect:real-to-fake
```

This creates connections between all real users (non-seeded) and fake users (seeded). By default, each real user gets connected to 10 fake users.

### Manual Execution

Run the script manually at any time:

```bash
cd backend
npm run generate:content
```

This will generate 5-15 random content items immediately.

### Scheduled Execution with PM2

The system is configured to run automatically every hour using PM2 cron jobs.

1. **Start with PM2:**

```bash
cd backend
npm run pm2:start
```

This will start both the main server and the content generator cron job.

2. **Check Status:**

```bash
npm run pm2:monit
```

Or view logs:

```bash
npm run pm2:logs
```

3. **Stop:**

```bash
npm run pm2:stop
```

### Custom Cron Schedule

To change the frequency, edit `backend/ecosystem.config.js` and modify the `cron_restart` value:

```javascript
{
    name: 'fittedin-content-generator',
    // ...
    cron_restart: '0 * * * *', // Every hour
    // Options:
    // '0 * * * *' - Every hour
    // '*/30 * * * *' - Every 30 minutes
    // '0 */2 * * *' - Every 2 hours
    // '0 9 * * *' - Daily at 9 AM
}
```

## How It Works

1. **Connects to Database:** Uses Sequelize to connect to PostgreSQL
2. **Finds Seeded Users:** Selects users with email domain `@fittedin-seeded.com`
3. **Random Content Generation:** Uses weighted probabilities to determine content type
4. **Service Layer Integration:** Uses existing service methods to ensure data consistency
5. **Activity Logging:** Automatically creates activity records where appropriate

## Content Distribution

The system ensures realistic content distribution:

- **Posts:** Randomly selected users create posts with fitness-related content
- **Goal Updates:** Only active goals are updated, with realistic progress increments
- **Interactions:** Users interact with posts from other users (not their own)
- **Connections:** Only creates connections between users who aren't already connected

## Time Stamps

All generated content uses realistic timestamps:

- Posts: Created within the last 1-24 hours
- Interactions: Within the last day
- Activities: Logged with current timestamp

## Logs

The content generator outputs logs to:

- Console output (stdout)
- PM2 logs: `backend/logs/content-generator-out.log`
- Error logs: `backend/logs/content-generator-error.log`

Example output:

```
🎲 Starting dynamic content generation...

✅ Database connection established.

📊 Found 50 seeded users

📝 Generating 8 content items...

   ✓ Created post by Sarah Chen
   ✓ Updated progress on "Lose 10 kg" for Mike Johnson
   ✓ Sarah Chen liked a post
   ✓ Created post by Emily Rodriguez
   ✓ Mike Johnson sent connection request to David Kim
   ✓ Updated progress on "Run 5km" for Lisa Wang
   ✓ Emily Rodriguez commented on a post
   ✓ Created post by David Kim

==================================================
✅ Dynamic content generation completed!
==================================================

📊 Summary:
   Posts: 3
   Goal Updates: 2
   Post Interactions: 2
   Connection Requests: 1
   Total: 8
```

## Troubleshooting

### No Content Generated

**Problem:** Script runs but generates 0 items

**Solutions:**
- Check that seeded users exist: `npm run db:seed:faker`
- Verify users have email domain `@fittedin-seeded.com`
- Check database connection

### Too Much/Little Content

**Problem:** Want to adjust content generation frequency

**Solutions:**
- Adjust `MIN_CONTENT_PER_RUN` and `MAX_CONTENT_PER_RUN`
- Change cron schedule in `ecosystem.config.js`

### PM2 Cron Not Running

**Problem:** Scheduled tasks don't execute

**Solutions:**
- Ensure PM2 is installed: `npm install -g pm2`
- Start PM2: `npm run pm2:start`
- Check PM2 status: `pm2 status`
- View PM2 logs: `pm2 logs fittedin-content-generator`

### Database Connection Errors

**Problem:** Cannot connect to database

**Solutions:**
- Verify database is running
- Check database credentials in `.env`
- Ensure migrations have run: `npm run db:migrate`

## Best Practices

1. **Production:** Run the generator every 1-2 hours to maintain fresh content
2. **Development:** Run manually as needed for testing
3. **Monitoring:** Check logs regularly to ensure content is being generated
4. **Adjustment:** Monitor user engagement and adjust content frequency accordingly

## Security Considerations

- The generator only creates content for seeded users (identified by email domain)
- Uses existing service layer methods with proper validation
- No direct database manipulation, all through models/services
- Can be disabled via environment variable

## Future Enhancements

Potential improvements:

- More diverse content templates
- User behavior patterns (some users post more frequently)
- Seasonal/holiday content variations
- Image attachments (when image upload is implemented)
- Analytics on generated content performance

## Related Documentation

- [Database Seeding Guide](./SEEDED_DATA_GUIDE.md)
- [PM2 Deployment Guide](../deployment/AWS_EC2_DEPLOYMENT.md)
- [Database Management](./DATABASE_MANAGEMENT.md)

