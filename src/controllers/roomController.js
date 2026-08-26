// backend/src/controllers/roomController.js
const { Room, Booking } = require('../models');

const getAllRooms = async (req, res) => {
    try {
        const { minPrice, maxPrice, maxOccupancy, roomType, features } = req.query;
        
        // Parse features if provided as comma-separated string
        let featuresArray = null;
        if (features) {
            featuresArray = features.split(',').map(f => f.trim());
        }

        const filters = {
            minPrice: minPrice ? parseFloat(minPrice) : undefined,
            maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
            maxOccupancy: maxOccupancy ? parseInt(maxOccupancy) : undefined,
            roomType: roomType || undefined,
            features: featuresArray
        };

        const rooms = await Room.findAll(filters);
        
        // Get average ratings for each room
        const roomsWithRatings = await Promise.all(
            rooms.map(async (room) => {
                const rating = await Room.getAverageRating(room.id);
                return {
                    ...room,
                    averageRating: rating.average,
                    reviewCount: rating.count
                };
            })
        );

        res.json({
            count: roomsWithRatings.length,
            rooms: roomsWithRatings
        });

    } catch (error) {
        console.error('Get all rooms error:', error);
        res.status(500).json({
            message: 'Failed to fetch rooms. Please try again later.'
        });
    }
};

const getRoomById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const room = await Room.findById(id);
        if (!room) {
            return res.status(404).json({
                message: 'Room not found.'
            });
        }

        // Get average rating
        const rating = await Room.getAverageRating(id);
        room.averageRating = rating.average;
        room.reviewCount = rating.count;

        // Get reviews for this room
        const reviews = await Room.getReviews(id);
        room.reviews = reviews;

        res.json({ room });

    } catch (error) {
        console.error('Get room by id error:', error);
        res.status(500).json({
            message: 'Failed to fetch room details. Please try again later.'
        });
    }
};

const checkAvailability = async (req, res) => {
    try {
        const { id } = req.params;
        const { checkIn, checkOut } = req.query;

        if (!checkIn || !checkOut) {
            return res.status(400).json({
                message: 'Please provide checkIn and checkOut dates.'
            });
        }

        const room = await Room.findById(id);
        if (!room) {
            return res.status(404).json({
                message: 'Room not found.'
            });
        }

        const isAvailable = await Room.isAvailable(id, checkIn, checkOut);

        res.json({
            roomId: id,
            roomNumber: room.room_number,
            isAvailable,
            checkIn,
            checkOut
        });

    } catch (error) {
        console.error('Check availability error:', error);
        res.status(500).json({
            message: 'Failed to check availability. Please try again later.'
        });
    }
};

const getRoomTypes = async (req, res) => {
    try {
        const rooms = await Room.findAll();
        const types = [...new Set(rooms.map(r => r.room_type))];
        
        res.json({ types });
    } catch (error) {
        console.error('Get room types error:', error);
        res.status(500).json({
            message: 'Failed to fetch room types.'
        });
    }
};

module.exports = {
    getAllRooms,
    getRoomById,
    checkAvailability,
    getRoomTypes
};