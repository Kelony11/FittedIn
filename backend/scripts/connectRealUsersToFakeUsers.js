/**
 * Script to connect real users (non-seeded) with fake users (seeded users)
 * This allows real users to see fake user content in their feed
 */

const { sequelize } = require('../src/config/database');
const { Op } = require('sequelize');

// Import models
const User = require('../src/models/User');
const Profile = require('../src/models/Profile');
const Goal = require('../src/models/Goal');
const Connection = require('../src/models/Connection');
const Activity = require('../src/models/Activity');
const Post = require('../src/models/Post');
const PostLike = require('../src/models/PostLike');
const PostComment = require('../src/models/PostComment');
const Notification = require('../src/models/Notification');

// Set up model associations
const models = { User, Profile, Goal, Connection, Activity, Post, PostLike, PostComment, Notification };
User.associate(models);
Profile.associate(models);
Goal.associate(models);
Connection.associate(models);
Activity.associate(models);
Post.associate(models);
PostLike.associate(models);
PostComment.associate(models);
Notification.associate(models);

// Configuration
const CONFIG = {
    SEEDED_USER_DOMAIN: '@fittedin-seeded.com',
    CONNECTIONS_PER_USER: parseInt(process.env.CONNECTIONS_PER_USER) || 10, // How many fake users to connect each real user to
    AUTO_ACCEPT: true // Auto-accept connections (since fake users would auto-accept anyway)
};

// Get real users (non-seeded)
async function getRealUsers() {
    try {
        const users = await User.findAll({
            where: {
                email: {
                    [Op.notLike]: `%${CONFIG.SEEDED_USER_DOMAIN}`
                }
            }
        });
        return users;
    } catch (error) {
        console.error('Error getting real users:', error);
        return [];
    }
}

// Get fake users (seeded)
async function getFakeUsers() {
    try {
        const users = await User.findAll({
            where: {
                email: {
                    [Op.like]: `%${CONFIG.SEEDED_USER_DOMAIN}`
                }
            }
        });
        return users;
    } catch (error) {
        console.error('Error getting fake users:', error);
        return [];
    }
}

// Connect a real user to fake users
async function connectUserToFakeUsers(realUser, fakeUsers) {
    try {
        // Get existing connections for this user
        const existingConnections = await Connection.findAll({
            where: {
                [Op.or]: [
                    { requester_id: realUser.id },
                    { receiver_id: realUser.id }
                ]
            }
        });

        const connectedUserIds = new Set([realUser.id]);
        existingConnections.forEach(conn => {
            if (conn.requester_id === realUser.id) {
                connectedUserIds.add(conn.receiver_id);
            } else {
                connectedUserIds.add(conn.requester_id);
            }
        });

        // Filter out already connected fake users
        const availableFakeUsers = fakeUsers.filter(u => !connectedUserIds.has(u.id));

        if (availableFakeUsers.length === 0) {
            return { connected: 0, alreadyConnected: connectedUserIds.size - 1 };
        }

        // Shuffle and take N fake users
        const shuffled = availableFakeUsers.sort(() => Math.random() - 0.5);
        const usersToConnect = shuffled.slice(0, Math.min(CONFIG.CONNECTIONS_PER_USER, shuffled.length));

        let connectedCount = 0;
        let alreadyConnectedCount = connectedUserIds.size - 1; // Exclude self

        for (const fakeUser of usersToConnect) {
            try {
                // Check if connection already exists
                const existing = await Connection.findOne({
                    where: {
                        [Op.or]: [
                            { requester_id: realUser.id, receiver_id: fakeUser.id },
                            { requester_id: fakeUser.id, receiver_id: realUser.id }
                        ]
                    }
                });

                if (existing) {
                    continue;
                }

                // Create connection (real user requests, fake user accepts automatically since they're seeded)
                const connection = await Connection.create({
                    requester_id: realUser.id,
                    receiver_id: fakeUser.id,
                    status: CONFIG.AUTO_ACCEPT ? 'accepted' : 'pending'
                });

                connectedCount++;

                // Create notification for fake user (optional, since they're fake)
                if (CONFIG.AUTO_ACCEPT) {
                    try {
                        await Notification.create({
                            user_id: realUser.id,
                            type: 'connection_accepted',
                            title: 'Connection Accepted',
                            message: `${fakeUser.display_name} accepted your connection request`,
                            related_entity_type: 'connection',
                            related_entity_id: connection.id,
                            from_user_id: fakeUser.id,
                            is_read: false
                        });
                    } catch (error) {
                        // Ignore notification errors
                    }
                }
            } catch (error) {
                if (!error.message.includes('unique_connection_pair') && !error.message.includes('Already')) {
                    console.error(`   ✗ Error connecting ${realUser.display_name} to ${fakeUser.display_name}:`, error.message);
                }
            }
        }

        return { connected: connectedCount, alreadyConnected: alreadyConnectedCount };
    } catch (error) {
        console.error(`Error connecting user ${realUser.display_name}:`, error);
        return { connected: 0, alreadyConnected: 0 };
    }
}

// Main function
async function connectRealUsersToFakeUsers() {
    try {
        console.log('🔗 Connecting real users to fake users...\n');

        // Connect to database
        await sequelize.authenticate();
        console.log('✅ Database connection established.\n');

        // Get users
        const realUsers = await getRealUsers();
        const fakeUsers = await getFakeUsers();

        if (realUsers.length === 0) {
            console.log('⚠️  No real users found. Please register a user first.');
            process.exit(0);
        }

        if (fakeUsers.length === 0) {
            console.log('⚠️  No fake users found. Please run seeding first: npm run db:seed:faker');
            process.exit(0);
        }

        console.log(`📊 Found ${realUsers.length} real user(s) and ${fakeUsers.length} fake user(s)`);
        console.log(`📝 Will connect each real user to up to ${CONFIG.CONNECTIONS_PER_USER} fake users\n`);

        const results = {
            totalRealUsers: realUsers.length,
            totalFakeUsers: fakeUsers.length,
            usersProcessed: 0,
            totalConnectionsCreated: 0,
            totalAlreadyConnected: 0
        };

        // Connect each real user to fake users
        for (const realUser of realUsers) {
            console.log(`🔗 Processing ${realUser.display_name} (${realUser.email})...`);

            const result = await connectUserToFakeUsers(realUser, fakeUsers);
            results.usersProcessed++;
            results.totalConnectionsCreated += result.connected;
            results.totalAlreadyConnected += result.alreadyConnected;

            if (result.connected > 0) {
                console.log(`   ✓ Created ${result.connected} new connections`);
            }
            if (result.alreadyConnected > 0) {
                console.log(`   ℹ️  Already had ${result.alreadyConnected} connections`);
            }
            if (result.connected === 0 && result.alreadyConnected === 0) {
                console.log(`   ℹ️  No new connections needed`);
            }
            console.log('');
        }

        // Summary
        console.log('='.repeat(50));
        console.log('✅ Connection process completed!');
        console.log('='.repeat(50));
        console.log('\n📊 Summary:');
        console.log(`   Real Users: ${results.totalRealUsers}`);
        console.log(`   Fake Users: ${results.totalFakeUsers}`);
        console.log(`   Users Processed: ${results.usersProcessed}`);
        console.log(`   New Connections Created: ${results.totalConnectionsCreated}`);
        console.log(`   Already Connected: ${results.totalAlreadyConnected}`);
        console.log('\n💡 Now real users can see fake user content in their feed!');
        console.log('   Refresh your Dashboard to see posts from connected fake users.\n');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    connectRealUsersToFakeUsers();
}

module.exports = { connectRealUsersToFakeUsers };

