/**
 * Complete API test for auto-accept functionality
 */

const http = require('http');

const API_BASE = 'http://localhost:3000/api';

// Helper function to make HTTP requests
function makeRequest(method, path, data = null, token = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, API_BASE);
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = http.request(url, options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = body ? JSON.parse(body) : {};
                    resolve({ status: res.statusCode, data: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', reject);

        if (data) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

async function testAutoAccept() {
    console.log('🧪 Testing Auto-Accept via API...\n');

    try {
        // Step 1: Login as a seeded user (to test sending request to another seeded user)
        console.log('Step 1: Logging in as a seeded user...');
        const loginResponse = await makeRequest('POST', '/api/auth/login', {
            email: 'christopher_howe9@fittedin-seeded.com',
            password: 'Password123!'
        });

        let token, userId;
        if (loginResponse.status === 200 && loginResponse.data.data && loginResponse.data.data.token) {
            console.log('✅ Login successful');
            token = loginResponse.data.data.token;
            userId = loginResponse.data.data.user.id;
            console.log(`   User ID: ${userId}, Name: ${loginResponse.data.data.user.display_name}`);
        } else {
            console.log('❌ Login failed:', loginResponse.data);
            return;
        }

        // Step 2: Find a different seeded user to connect to
        console.log('\nStep 2: Finding a different seeded user to connect to...');
        // Use a different seeded user ID (not the one we logged in as)
        // If current user is ID 14, use ID 15
        let seededUserId = userId === 14 ? 15 : 14;
        console.log(`✅ Will send request to seeded user ID: ${seededUserId}`);

        // Step 3: Check current connection status
        console.log('\nStep 3: Checking current connection status...');
        const statusResponse = await makeRequest('GET', `/api/connections/status/${seededUserId}`, null, token);
        console.log(`   Current status: ${JSON.stringify(statusResponse.data)}`);

        // Step 4: Send connection request
        console.log('\nStep 4: Sending connection request to seeded user...');
        const requestResponse = await makeRequest('POST', '/api/connections', {
            receiver_id: seededUserId
        }, token);

        if (requestResponse.status === 201) {
            const connection = requestResponse.data.data.connection;
            console.log(`✅ Connection request sent`);
            console.log(`   Connection ID: ${connection.id}`);
            console.log(`   Status: ${connection.status}`);

            if (connection.status === 'accepted') {
                console.log('\n🎉 SUCCESS! Connection was automatically accepted!');
            } else {
                console.log('\n⚠️  Connection is pending (not auto-accepted)');
                console.log('   This might mean:');
                console.log('   - User is not detected as seeded');
                console.log('   - Auto-accept service is not working');
            }
        } else {
            console.log(`❌ Failed to send connection request: ${requestResponse.status}`);
            console.log(`   Response: ${JSON.stringify(requestResponse.data)}`);
        }

        // Step 5: Check connection status again
        console.log('\nStep 5: Checking connection status after request...');
        const finalStatusResponse = await makeRequest('GET', `/api/connections/status/${seededUserId}`, null, token);
        console.log(`   Final status: ${JSON.stringify(finalStatusResponse.data)}`);

        // Step 6: Test auto-accept endpoint
        console.log('\nStep 6: Testing auto-accept endpoint...');
        const autoAcceptResponse = await makeRequest('POST', '/api/connections/auto-accept-pending', null, token);
        if (autoAcceptResponse.status === 200) {
            console.log(`✅ Auto-accept endpoint works`);
            console.log(`   Result: ${JSON.stringify(autoAcceptResponse.data.data)}`);
        } else {
            console.log(`❌ Auto-accept endpoint failed: ${autoAcceptResponse.status}`);
        }

        console.log('\n✅ Test completed!\n');

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run the test
testAutoAccept();

