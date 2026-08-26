// backend/test-rooms.js
const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:5000/api';

const testRooms = async () => {
    try {
        console.log('🏨 Testing Room Endpoints...\n');

        // 1. Get all rooms
        console.log('📝 Testing GET /rooms...');
        const roomsRes = await axios.get(`${BASE_URL}/rooms`);
        console.log(`✅ Found ${roomsRes.data.count} rooms`);
        if (roomsRes.data.rooms.length > 0) {
            console.log(`   First room: ${roomsRes.data.rooms[0].room_type} - £${roomsRes.data.rooms[0].price_per_night}`);
        }

        // 2. Get room types
        console.log('\n📝 Testing GET /rooms/types...');
        const typesRes = await axios.get(`${BASE_URL}/rooms/types`);
        console.log(`✅ Room types: ${typesRes.data.types.join(', ')}`);

        // 3. Get room by ID
        if (roomsRes.data.rooms.length > 0) {
            const roomId = roomsRes.data.rooms[0].id;
            console.log(`\n📝 Testing GET /rooms/${roomId}...`);
            const roomRes = await axios.get(`${BASE_URL}/rooms/${roomId}`);
            console.log(`✅ Room details: ${roomRes.data.room.room_type}`);
            console.log(`   Price: £${roomRes.data.room.price_per_night}`);
            console.log(`   Images: ${roomRes.data.room.images?.length || 0} images`);
            console.log(`   Rating: ${roomRes.data.room.averageRating || 'No reviews yet'}`);
        }

        // 4. Test availability
        if (roomsRes.data.rooms.length > 0) {
            const roomId = roomsRes.data.rooms[0].id;
            const checkIn = '2026-09-01';
            const checkOut = '2026-09-03';
            console.log(`\n📝 Testing GET /rooms/${roomId}/availability?checkIn=${checkIn}&checkOut=${checkOut}...`);
            const availRes = await axios.get(`${BASE_URL}/rooms/${roomId}/availability`, {
                params: { checkIn, checkOut }
            });
            console.log(`✅ Room ${availRes.data.roomNumber} is ${availRes.data.isAvailable ? 'AVAILABLE' : 'NOT AVAILABLE'}`);
        }

        // 5. Test filters
        console.log('\n📝 Testing GET /rooms with filters...');
        const filterRes = await axios.get(`${BASE_URL}/rooms`, {
            params: {
                minPrice: 80,
                maxPrice: 150,
                maxOccupancy: 2
            }
        });
        console.log(`✅ Found ${filterRes.data.count} rooms between £80-£150 for 2 guests`);

        console.log('\n🎉 All room endpoints tests passed!');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data?.message || error.message);
        if (error.response?.data?.errors) {
            console.error('   Details:', error.response.data.errors);
        }
    }
};

testRooms();