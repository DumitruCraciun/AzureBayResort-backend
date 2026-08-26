// backend/src/controllers/bookingController.js
const { Booking, Room, User } = require('../models');

const createBooking = async (req, res) => {
    try {
        const { room_id, check_in_date, check_out_date, guest_count = 1, special_requests = '' } = req.body;
        const user_id = req.userId;

        // Validate dates
        if (new Date(check_in_date) >= new Date(check_out_date)) {
            return res.status(400).json({
                message: 'Check-out date must be after check-in date.'
            });
        }

        // Check if room exists
        const room = await Room.findById(room_id);
        if (!room) {
            return res.status(404).json({
                message: 'Room not found.'
            });
        }

        // Check availability
        const isAvailable = await Booking.isRoomAvailable(room_id, check_in_date, check_out_date);
        if (!isAvailable) {
            return res.status(409).json({
                message: 'Room is not available for the selected dates.'
            });
        }

        // Calculate total price
        const days = Math.ceil((new Date(check_out_date) - new Date(check_in_date)) / (1000 * 60 * 60 * 24));
        const total_price = room.price_per_night * days;

        // Create booking
        const booking = await Booking.create({
            user_id,
            room_id,
            check_in_date,
            check_out_date,
            total_price,
            guest_count,
            special_requests
        });

        // Get full booking details
        const bookingDetails = await Booking.findById(booking.id);

        res.status(201).json({
            message: 'Booking created successfully! Please proceed to payment.',
            booking: bookingDetails
        });

    } catch (error) {
        console.error('Create booking error:', error);
        if (error.message === 'Room is not available for the selected dates') {
            return res.status(409).json({
                message: error.message
            });
        }
        res.status(500).json({
            message: 'Failed to create booking. Please try again later.'
        });
    }
};

const getUserBookings = async (req, res) => {
    try {
        const bookings = await User.getBookings(req.userId);
        
        res.json({
            count: bookings.length,
            bookings
        });

    } catch (error) {
        console.error('Get user bookings error:', error);
        res.status(500).json({
            message: 'Failed to fetch bookings. Please try again later.'
        });
    }
};

const getBookingById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const booking = await Booking.findById(id);
        if (!booking) {
            return res.status(404).json({
                message: 'Booking not found.'
            });
        }

        // Check if user owns this booking or is admin
        if (booking.user_id !== req.userId) {
            const isAdmin = await User.isAdmin(req.userId);
            if (!isAdmin) {
                return res.status(403).json({
                    message: 'You do not have permission to view this booking.'
                });
            }
        }

        res.json({ booking });

    } catch (error) {
        console.error('Get booking by id error:', error);
        res.status(500).json({
            message: 'Failed to fetch booking details.'
        });
    }
};

const cancelBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
		
		 console.log(`📝 Cancelling booking: ${id}`);

        const booking = await Booking.findById(id);
        if (!booking) {
            return res.status(404).json({
                message: 'Booking not found.'
            });
        }
		
		console.log(`📊 Booking status: ${booking.status}`); // Debug
        console.log(`👤 User ID: ${req.userId}, Booking User ID: ${booking.user_id}`); // Debug

        // Check if user owns this booking or is admin
        if (booking.user_id !== req.userId) {
            const isAdmin = await User.isAdmin(req.userId);
            if (!isAdmin) {
                return res.status(403).json({
                    message: 'You do not have permission to cancel this booking.'
                });
            }
        }

        // Check if booking can be cancelled
        if (booking.status === 'cancelled') {
            return res.status(400).json({
                message: 'Booking is already cancelled.'
            });
        }

        if (booking.status === 'completed') {
            return res.status(400).json({
                message: 'Cannot cancel a completed booking.'
            });
        }

        const cancelledBooking = await Booking.cancel(id, reason || 'Cancelled by user');

        res.json({
            message: 'Booking cancelled successfully.',
            booking: cancelledBooking
        });

    } catch (error) {
        console.error('Cancel booking error:', error);
		console.error('Stack:', error.stack);
        res.status(500).json({
            message: 'Failed to cancel booking. Please try again later.'
        });
    }
};

const updateBookingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Check if user is admin
        const isAdmin = await User.isAdmin(req.userId);
        if (!isAdmin) {
            return res.status(403).json({
                message: 'Admin privileges required to update booking status.'
            });
        }

        const booking = await Booking.findById(id);
        if (!booking) {
            return res.status(404).json({
                message: 'Booking not found.'
            });
        }

        const updatedBooking = await Booking.updateStatus(id, status);

        res.json({
            message: `Booking status updated to ${status}.`,
            booking: updatedBooking
        });

    } catch (error) {
        console.error('Update booking status error:', error);
        if (error.message === 'Invalid status') {
            return res.status(400).json({
                message: error.message
            });
        }
        res.status(500).json({
            message: 'Failed to update booking status.'
        });
    }
};

module.exports = {
    createBooking,
    getUserBookings,
    getBookingById,
    cancelBooking,
    updateBookingStatus
};