# Auto-Accept Connection Requests for Seeded Users

This feature automatically accepts connection requests sent to seeded/fake users, making the testing experience smoother and more realistic.

## Overview

When a real user sends a connection request to a seeded user (fake user created by the seeding script), the request is automatically accepted. This allows real users to immediately see posts and content from seeded users in their feed.

## How It Works

### 1. Seeded User Detection

Seeded users are identified by their email domain:
- `@fittedin-seeded.com` - Primary pattern for seeded users
- `@example.com` - Fallback pattern
- `@faker.com` - Fallback pattern
- `@test.com` - Fallback pattern

The seeding script creates users with emails like: `firstname.lastname@fittedin-seeded.com`

### 2. Automatic Acceptance

When a connection request is sent:
1. The system checks if the receiver is a seeded user
2. If yes, the connection is automatically accepted
3. A notification is sent to the requester
4. The connection status is immediately updated to "accepted"

### 3. Manual Processing

You can also manually trigger auto-accept for all pending requests:

```bash
# Using curl
curl -X POST http://localhost:3000/api/connections/auto-accept-pending \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## API Endpoints

### Auto-Accept Pending Requests
**POST** `/api/connections/auto-accept-pending`

Processes all pending connection requests and auto-accepts those sent to seeded users.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalPending": 10,
    "autoAccepted": 7
  },
  "message": "Auto-accept processing completed"
}
```

## Usage Examples

### Testing the Feature

1. **Seed the database:**
   ```bash
   cd backend
   npm run db:seed:faker
   ```

2. **Login as a real user** (or use a seeded user)

3. **Send connection request to a seeded user:**
   ```bash
   curl -X POST http://localhost:3000/api/connections \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"receiver_id": 5}'
   ```

4. **Check connection status:**
   ```bash
   curl http://localhost:3000/api/connections/status/5 \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```
   
   The status should be `"accepted"` immediately.

### Manual Processing

If you have existing pending requests, you can process them all:

```bash
curl -X POST http://localhost:3000/api/connections/auto-accept-pending \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Implementation Details

### Files Modified

1. **`backend/src/services/autoAcceptService.js`** - New service for auto-accept logic
2. **`backend/src/services/connectionService.js`** - Integrated auto-accept on request send
3. **`backend/src/controllers/connectionController.js`** - Added endpoint for manual processing
4. **`backend/src/routes/connections.js`** - Added route for auto-accept endpoint
5. **`backend/scripts/seedDatabase.js`** - Updated to use `@fittedin-seeded.com` domain

### Service Methods

#### `isSeededUser(userId)`
Checks if a user is a seeded user by examining their email domain.

#### `autoAcceptIfSeeded(connectionId, receiverId)`
Automatically accepts a connection request if the receiver is a seeded user.

#### `processPendingRequestsForSeededUsers()`
Processes all pending connection requests and auto-accepts those for seeded users.

## Benefits

1. **Better Testing Experience**: Real users can immediately connect with seeded users
2. **Realistic Feed**: Users see posts from seeded users right away
3. **No Manual Intervention**: No need to manually accept requests for fake users
4. **Flexible**: Can be disabled or modified for specific use cases

## Configuration

The auto-accept feature is enabled by default. To disable it, you would need to modify the `connectionService.js` to skip the auto-accept call.

## Future Enhancements

Potential improvements:
- Add a flag in the User model to explicitly mark seeded users
- Add configuration to control auto-accept behavior
- Add scheduled job to periodically process pending requests
- Add statistics on auto-accepted connections

---

**Note**: This feature is designed for development and testing environments. In production, you may want to disable or modify this behavior.

