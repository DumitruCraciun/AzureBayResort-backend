// backend/test-auth.js
const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:5000/api';

const testAuth = async () => {
    try {
        console.log('🔐 Testing Authentication...\n');

        // 1. Register
        console.log('📝 Testing Registration...');
        const registerData = {
            email: `test_${Date.now()}@example.com`,
            password: 'password123',
            full_name: 'Test User',
            phone: '+1234567890'
        };

        const registerRes = await axios.post(`${BASE_URL}/auth/register`, registerData);
        console.log('✅ Registration successful!');
        console.log(`   User: ${registerRes.data.user.email}`);
        console.log(`   Token: ${registerRes.data.token.substring(0, 20)}...`);
        const token = registerRes.data.token;

        // 2. Login
        console.log('\n📝 Testing Login...');
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: registerData.email,
            password: registerData.password
        });
        console.log('✅ Login successful!');
        console.log(`   User: ${loginRes.data.user.email}`);

        // 3. Get Profile
        console.log('\n📝 Testing Get Profile...');
        const profileRes = await axios.get(`${BASE_URL}/auth/profile`, {
            headers: {
                Authorization: `Bearer ${loginRes.data.token}`
            }
        });
        console.log('✅ Profile retrieved!');
        console.log(`   Name: ${profileRes.data.user.full_name}`);
        console.log(`   Email: ${profileRes.data.user.email}`);

        console.log('\n🎉 All authentication tests passed!');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data?.message || error.message);
        if (error.response?.data?.errors) {
            console.error('   Details:', error.response.data.errors);
        }
    }
};

testAuth();