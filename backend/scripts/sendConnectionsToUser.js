/**
 * Script to send connection requests from seeded users to a real user
 * This helps populate the connections page for testing
 */

const { sequelize } = require('../src/config/database');
const User = require('../src/models/User');
const Connection = require('../src/models/Connection');
const autoAcceptService = require('../src/services/autoAcceptService');

async function sendConnectionsToUser(targetUserId, count = 5) {
    try {
        console.log(`\n📤 Sending ${count} connection requests to user ID ${targetUserId}...\n`);

        // Connect to database
        await sequelize.authenticate();
        console.log('✅ Database connection established.\n');

        // Get target user
        const targetUser = await User.findByPk(targetUserId);
        if (!targetUser) {
            console.log(`❌ User with ID ${targetUserId} not found!`);
            process.exit(1);
        }

        console.log(`✅ Target user: ${targetUser.display_name} (${targetUser.email})\n`);

        // Get seeded users
        const seededUsers = await User.findAll({
            where: {
                email: {
                    [require('sequelize').Op.like]: '%@fittedin-seeded.com%'
                }
            },
            limit: count + 10 // Get extra in case some already have connections
        });

        if (seededUsers.length === 0) {
            console.log('❌ No seeded users found! Run seeding first: npm run db:seed:faker');
            process.exit(1);
        }

        console.log(`✅ Found ${seededUsers.length} seeded users\n`);

        // Check existing connections
        const existingConnections = await Connection.findAll({
            where: {
                [require('sequelize').Op.or]: [
                    { requester_id: targetUserId },
                    { receiver_id: targetUserId }
                ]
            }
        });

        const connectedUserIds = new Set();
        existingConnections.forEach(conn => {
            if (conn.requester_id === targetUserId) {
                connectedUserIds.add(conn.receiver_id);
            } else {
                connectedUserIds.add(conn.requester_id);
            }
        });

        console.log(`📊 User already has ${connectedUserIds.size} connections\n`);

        // Send connection requests
        let sentCount = 0;
        let acceptedCount = 0;

        for (const seededUser of seededUsers) {
            // Skip if already connected
            if (connectedUserIds.has(seededUser.id)) {
                continue;
            }

            // Skip if trying to connect to self
            if (seededUser.id === targetUserId) {
                continue;
            }

            // Check if connection already exists
            const existing = await Connection.findOne({
                where: {
                    [require('sequelize').Op.or]: [
                        { requester_id: seededUser.id, receiver_id: targetUserId },
                        { requester_id: targetUserId, receiver_id: seededUser.id }
                    ]
                }
            });

            if (existing) {
                continue;
            }

            try {
                // Create connection request (seeded user requests to connect with target user)
                const connection = await Connection.create({
                    requester_id: seededUser.id,
                    receiver_id: targetUserId,
                    status: 'pending'
                });

                console.log(`   ✅ Sent request from ${seededUser.display_name} (ID: ${seededUser.id})`);
                sentCount++;

                // Since target user is real, we don't auto-accept
                // But we could auto-accept some for testing
                if (sentCount <= Math.floor(count * 0.5)) {
                    // Auto-accept first half for immediate connections
                    await connection.update({ status: 'accepted' });
                    acceptedCount++;
                    console.log(`      → Auto-accepted for testing`);
                }

                if (sentCount >= count) {
                    break;
                }
            } catch (error) {
                if (!error.message.includes('unique_connection_pair')) {
                    console.error(`   ❌ Error: ${error.message}`);
                }
            }
        }

        console.log(`\n✅ Summary:`);
        console.log(`   Requests sent: ${sentCount}`);
        console.log(`   Auto-accepted: ${acceptedCount}`);
        console.log(`   Pending: ${sentCount - acceptedCount}`);
        console.log(`\n💡 Now refresh your Connections page to see the requests!\n`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        console.error(error.stack);
        process.exit(1);
    }
}

// Get user ID from command line or use default
const targetUserId = process.argv[2] ? parseInt(process.argv[2]) : 1;
const count = process.argv[3] ? parseInt(process.argv[3]) : 10;

sendConnectionsToUser(targetUserId, count);

