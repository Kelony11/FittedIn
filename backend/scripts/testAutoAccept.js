/**
 * Test script for auto-accept functionality
 * This script tests if the auto-accept service works correctly
 */

const { sequelize } = require('../src/config/database');
const User = require('../src/models/User');
const Connection = require('../src/models/Connection');
const autoAcceptService = require('../src/services/autoAcceptService');

async function testAutoAccept() {
    try {
        console.log('🧪 Testing Auto-Accept Functionality...\n');

        // Connect to database
        await sequelize.authenticate();
        console.log('✅ Database connection established.\n');

        // Find a seeded user (email contains @fittedin-seeded.com)
        const seededUser = await User.findOne({
            where: {
                email: {
                    [require('sequelize').Op.like]: '%@fittedin-seeded.com%'
                }
            }
        });

        if (!seededUser) {
            console.log('❌ No seeded users found!');
            console.log('💡 Run the seeding script first: npm run db:seed:faker\n');
            process.exit(1);
        }

        console.log(`✅ Found seeded user: ${seededUser.display_name} (${seededUser.email})\n`);

        // Test 1: Check if user is detected as seeded
        console.log('Test 1: Checking if user is detected as seeded...');
        const isSeeded = await autoAcceptService.isSeededUser(seededUser.id);
        console.log(`   Result: ${isSeeded ? '✅ YES' : '❌ NO'}\n`);

        if (!isSeeded) {
            console.log('❌ User is not detected as seeded!');
            console.log('   This might be because:');
            console.log('   - Email pattern doesn\'t match');
            console.log('   - User was created more than 24 hours ago\n');
        }

        // Test 2: Check pending connections
        console.log('Test 2: Checking for pending connections...');
        const pendingConnections = await Connection.findAll({
            where: { status: 'pending' },
            limit: 5
        });
        console.log(`   Found ${pendingConnections.length} pending connections\n`);

        if (pendingConnections.length > 0) {
            // Test 3: Try to auto-accept one
            const testConnection = pendingConnections[0];
            console.log(`Test 3: Testing auto-accept for connection ID ${testConnection.id}...`);

            const receiverId = testConnection.receiver_id;
            const wasAccepted = await autoAcceptService.autoAcceptIfSeeded(
                testConnection.id,
                receiverId
            );

            console.log(`   Result: ${wasAccepted ? '✅ AUTO-ACCEPTED' : '❌ NOT ACCEPTED'}\n`);

            if (wasAccepted) {
                // Reload to check status
                await testConnection.reload();
                console.log(`   Connection status: ${testConnection.status}\n`);
            }
        }

        // Test 4: Process all pending requests
        console.log('Test 4: Processing all pending requests for seeded users...');
        const result = await autoAcceptService.processPendingRequestsForSeededUsers();
        console.log(`   Total pending: ${result.totalPending}`);
        console.log(`   Auto-accepted: ${result.autoAccepted}\n`);

        console.log('✅ All tests completed!\n');
        process.exit(0);
    } catch (error) {
        console.error('❌ Test failed:', error);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run the test
testAutoAccept();

