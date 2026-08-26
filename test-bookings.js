// backend/test-bookings.js
const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:5000/api';
let authToken = null;
let testBookingId = null;

const testBookings = async () => {
    try {
        console.log('📅 Testing Booking Endpoints...\n');

        // 1. Login to get token
        console.log('🔐 Logging in...');
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'admin@azurebayresort.com',
            password: 'admin123'
        });
        authToken = loginRes.data.token;
        console.log('✅ Login successful!\n');

        // 2. Get rooms to find a room for booking
        console.log('📝 Getting rooms...');
        const roomsRes = await axios.get(`${BASE_URL}/rooms`);
        const room = roomsRes.data.rooms[0];
        console.log(`✅ Found room: ${room.room_type} (${room.id})\n`);

        // 3. Create a booking with FUTURE dates (not overlapping with existing)
        console.log('📝 Creating booking...');
        // Folosește date diferite (ex: peste 2 luni)
        const today = new Date();
        const checkIn = new Date(today);
        checkIn.setMonth(today.getMonth() + 2); // +2 luni
        checkIn.setDate(1); // Ziua 1
        const checkOut = new Date(checkIn);
        checkOut.setDate(checkIn.getDate() + 3); // 3 nopti
        
        const checkInStr = checkIn.toISOString().split('T')[0];
        const checkOutStr = checkOut.toISOString().split('T')[0];
        
        console.log(`   Check-in: ${checkInStr}`);
        console.log(`   Check-out: ${checkOutStr}`);

        const bookingData = {
            room_id: room.id,
            check_in_date: checkInStr,
            check_out_date: checkOutStr,
            guest_count: 2,
            special_requests: 'Please prepare a nice view room'
        };

        const bookingRes = await axios.post(`${BASE_URL}/bookings`, bookingData, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        testBookingId = bookingRes.data.booking.id;
        console.log('✅ Booking created!');
        console.log(`   ID: ${testBookingId}`);
        console.log(`   Total: £${bookingRes.data.booking.total_price}\n`);

        // 4. Get all user bookings
        console.log('📝 Getting user bookings...');
        const userBookingsRes = await axios.get(`${BASE_URL}/bookings`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        console.log(`✅ Found ${userBookingsRes.data.count} bookings\n`);

        // 5. Get booking by ID
        console.log(`📝 Getting booking ${testBookingId}...`);
        const bookingDetailsRes = await axios.get(`${BASE_URL}/bookings/${testBookingId}`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        console.log(`✅ Booking details:`);
        console.log(`   Room: ${bookingDetailsRes.data.booking.room_type}`);
        console.log(`   Status: ${bookingDetailsRes.data.booking.status}`);
        console.log(`   Total: £${bookingDetailsRes.data.booking.total_price}\n`);

        // 6. Cancel booking
        console.log('📝 Cancelling booking...');
        const cancelRes = await axios.put(`${BASE_URL}/bookings/${testBookingId}/cancel`, 
            { reason: 'Testing cancellation' },
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        console.log(`✅ Booking cancelled!`);
        console.log(`   Status: ${cancelRes.data.booking.status}\n`);

        console.log('🎉 All booking endpoints tests passed!');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data?.message || error.message);
        if (error.response?.data?.errors) {
            console.error('   Details:', error.response.data.errors);
        }
        // Dacă e eroare de disponibilitate, arată mai multe detalii
        if (error.response?.status === 409) {
            console.log('\n💡 Hint: Try using different dates or check if room is already booked.');
        }
    }
};

testBookings();