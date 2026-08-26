// backend/src/seeders/seed.js
const bcrypt = require('bcrypt');
const pool = require('../config/database');

const rooms = [
    {
        room_number: '101',
        room_type: 'Standard Single',
        description: 'Cozy room with sea view, perfect for solo travelers.',
        price_per_night: 70.00,
        max_occupancy: 1,
        features: ['Sea View', 'Free WiFi', 'Air Conditioning', 'TV']
    },
    {
        room_number: '102',
        room_type: 'Double Deluxe',
        description: 'Spacious room with a balcony overlooking the pool.',
        price_per_night: 90.00,
        max_occupancy: 2,
        features: ['Pool View', 'Free WiFi', 'Air Conditioning', 'TV', 'Mini Bar']
    },
    {
        room_number: '103',
        room_type: 'Poolside Suite',
        description: 'Luxury suite with direct access to the pool area.',
        price_per_night: 100.00,
        max_occupancy: 2,
        features: ['Pool Access', 'Free WiFi', 'Air Conditioning', 'TV', 'Mini Bar', 'Jacuzzi']
    },
    {
        room_number: '104',
        room_type: 'Family Room',
        description: 'Large room for families, with two beds and a play area.',
        price_per_night: 120.00,
        max_occupancy: 4,
        features: ['Sea View', 'Free WiFi', 'Air Conditioning', 'TV', 'Mini Bar', 'Kids Play Area']
    },
    {
        room_number: '105',
        room_type: 'Honeymoon Suite',
        description: 'Romantic suite with panoramic sea view and king-size bed.',
        price_per_night: 150.00,
        max_occupancy: 2,
        features: ['Sea View', 'Free WiFi', 'Air Conditioning', 'TV', 'Mini Bar', 'King Size Bed']
    },
    {
        room_number: '106',
        room_type: 'Presidential Penthouse',
        description: 'The ultimate luxury experience with a private terrace.',
        price_per_night: 250.00,
        max_occupancy: 3,
        features: ['Sea View', 'Private Terrace', 'Free WiFi', 'Air Conditioning', 'TV', 'Mini Bar']
    }
];

const seedDatabase = async () => {
    try {
        // Clear existing data (be careful with production!)
        await pool.query('DELETE FROM bookings');
        await pool.query('DELETE FROM reviews');
        await pool.query('DELETE FROM room_images');
        await pool.query('DELETE FROM rooms');
        await pool.query('DELETE FROM users');

        // Create admin user
        const adminPassword = await bcrypt.hash('admin123', 10);
        await pool.query(
            `INSERT INTO users (email, password_hash, full_name, phone, role) 
             VALUES ($1, $2, $3, $4, $5)`,
            ['admin@azurebayresort.com', adminPassword, 'Admin', '+1234567890', 'admin']
        );

        // Insert rooms
        for (const room of rooms) {
            const result = await pool.query(
                `INSERT INTO rooms (room_number, room_type, description, price_per_night, max_occupancy, features)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING id`,
                [room.room_number, room.room_type, room.description, room.price_per_night, room.max_occupancy, room.features]
            );
            
            const roomId = result.rows[0].id;
            
            // Add sample images (will be served from /media folder)
            const images = [
                `${room.room_type.toLowerCase().replace(/ /g, '_')}_1.jpg`,
                `${room.room_type.toLowerCase().replace(/ /g, '_')}_2.jpg`,
                `${room.room_type.toLowerCase().replace(/ /g, '_')}_3.jpg`
            ];
            
            for (let i = 0; i < images.length; i++) {
                await pool.query(
                    `INSERT INTO room_images (room_id, image_url, is_primary, sort_order)
                     VALUES ($1, $2, $3, $4)`,
                    [roomId, `/media/${images[i]}`, i === 0, i]
                );
            }
        }

        console.log('✅ Database seeded successfully!');
        console.log('📧 Admin user: admin@azurebayresort.com / admin123');
        console.log('🏨 6 rooms with images have been created.');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
};

seedDatabase();