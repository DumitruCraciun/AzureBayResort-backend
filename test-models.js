// backend/test-models.js
require('dotenv').config();
const { User, Room, Booking, Review } = require('./src/models');

const testModels = async () => {
    try {
        console.log('🧪 Testing models...\n');

        // Test User
        console.log('📝 Testing User model...');
        const user = await User.create({
            email: 'test@azurebayresort.com',
            password: 'test123',
            full_name: 'Test User',
            phone: '+1234567890'
        });
        console.log('✅ User created:', user.email);

        // Test Room
        console.log('\n📝 Testing Room model...');
        const rooms = await Room.findAll({ minPrice: 50, maxPrice: 150 });
        console.log(`✅ Found ${rooms.length} rooms`);

        // Test Booking
        console.log('\n📝 Testing Booking model...');
        const booking = await Booking.create({
            user_id: user.id,
            room_id: rooms[0].id,
            check_in_date: '2026-09-01',
            check_out_date: '2026-09-03',
            total_price: 200.00,
            guest_count: 2
        });
        console.log('✅ Booking created:', booking.id);

        // Test Review
        console.log('\n📝 Testing Review model...');
        await Booking.updateStatus(booking.id, 'completed');
        const review = await Review.create({
            user_id: user.id,
            room_id: rooms[0].id,
            rating: 5,
            comment: 'Amazing stay!'
        });
        console.log('✅ Review created:', review.id);

        console.log('\n🎉 All models are working correctly!');
        
        // Clean up test data
        await Review.delete(review.id);
        await Booking.updateStatus(booking.id, 'cancelled');
        await User.delete(user.id);
        console.log('🧹 Test data cleaned up');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
};

testModels();