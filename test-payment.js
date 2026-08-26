// backend/test-payment.js
const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:5000/api';
let authToken = null;
let testBookingId = null;

const testPayment = async () => {
    try {
        console.log('💳 Testing Payment Integration...\n');

        // 1. Login
        console.log('🔐 Logging in...');
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'admin@azurebayresort.com',
            password: 'admin123'
        });
        authToken = loginRes.data.token;
        console.log('✅ Login successful!\n');

        // 2. Create a booking
        console.log('📝 Creating booking for payment test...');
        const roomsRes = await axios.get(`${BASE_URL}/rooms`);
        const room = roomsRes.data.rooms[0];
        
        const today = new Date();
        const checkIn = new Date(today);
        checkIn.setMonth(today.getMonth() + 3);
        checkIn.setDate(1);
        const checkOut = new Date(checkIn);
        checkOut.setDate(checkIn.getDate() + 2);
        
        const bookingRes = await axios.post(`${BASE_URL}/bookings`, {
            room_id: room.id,
            check_in_date: checkIn.toISOString().split('T')[0],
            check_out_date: checkOut.toISOString().split('T')[0],
            guest_count: 2
        }, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        testBookingId = bookingRes.data.booking.id;
        console.log(`✅ Booking created: ${testBookingId}\n`);

        // 3. Create payment intent
        console.log('💳 Creating payment intent...');
        const paymentRes = await axios.post(`${BASE_URL}/payments/create-intent`, {
            bookingId: testBookingId
        }, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        console.log(`✅ Payment intent created!`);
        console.log(`   Client Secret: ${paymentRes.data.clientSecret.substring(0, 30)}...`);
        console.log(`   Amount: £${paymentRes.data.amount}\n`);

        console.log('🎉 Payment integration test passed!');
        console.log('📌 Note: Use Stripe test card: 4242 4242 4242 4242');
        console.log(`   Booking ID: ${testBookingId}`);

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data?.message || error.message);
        if (error.response?.data?.errors) {
            console.error('   Details:', error.response.data.errors);
        }
    }
};

testPayment();