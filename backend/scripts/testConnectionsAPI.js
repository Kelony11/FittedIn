/**
 * Test script to check connections API response
 */

const http = require('http');

const API_BASE = 'http://localhost:3000/api';

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

async function test() {
    console.log('🧪 Testing Connections API...\n');

    // Step 1: Login
    console.log('Step 1: Logging in...');
    const loginResponse = await makeRequest('POST', '/api/auth/login', {
        email: 'zhihungchen@gmail.com',
        password: 'Password123!'
    });

    if (loginResponse.status !== 200 || !loginResponse.data.data?.token) {
        console.log('❌ Login failed:', loginResponse.data);
        return;
    }

    const token = loginResponse.data.data.token;
    const userId = loginResponse.data.data.user.id;
    console.log(`✅ Logged in as user ID: ${userId}\n`);

    // Step 2: Get connections
    console.log('Step 2: Getting accepted connections...');
    const connectionsResponse = await makeRequest('GET', '/api/connections?status=accepted', null, token);
    console.log('Status:', connectionsResponse.status);
    console.log('Response:', JSON.stringify(connectionsResponse.data, null, 2));
    console.log('');

    // Step 3: Get pending requests
    console.log('Step 3: Getting pending requests...');
    const pendingResponse = await makeRequest('GET', '/api/connections/pending', null, token);
    console.log('Status:', pendingResponse.status);
    console.log('Response:', JSON.stringify(pendingResponse.data, null, 2));
}

test();

