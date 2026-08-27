// backend/src/models/Booking.js
const pool = require('../config/database');

class Booking {
    /**
     * Get all bookings (admin only)
     * @param {Object} filters - { status, fromDate, toDate }
     * @returns {Promise<Array>} List of bookings
     */
    static async findAll(filters = {}) {
        let query = `
            SELECT b.*, 
                   u.email, u.full_name as user_name,
                   r.room_number, r.room_type
            FROM bookings b
            JOIN users u ON b.user_id = u.id
            JOIN rooms r ON b.room_id = r.id
            WHERE 1=1
        `;
        const values = [];
        let paramCount = 1;

        if (filters.status) {
            query += ` AND b.status = $${paramCount}`;
            values.push(filters.status);
            paramCount++;
        }

        if (filters.fromDate) {
            query += ` AND b.check_in_date >= $${paramCount}`;
            values.push(filters.fromDate);
            paramCount++;
        }

        if (filters.toDate) {
            query += ` AND b.check_out_date <= $${paramCount}`;
            values.push(filters.toDate);
            paramCount++;
        }

        query += ` ORDER BY b.created_at DESC`;

        const result = await pool.query(query, values);
        return result.rows;
    }

    /**
     * Find booking by ID
     * @param {string} id - Booking's UUID
     * @returns {Promise<Object|null>} Booking object or null
     */
    static async findById(id) {
        const result = await pool.query(
            `SELECT b.*, 
                    u.email, u.full_name as user_name, u.phone,
                    r.room_number, r.room_type, r.price_per_night
             FROM bookings b
             JOIN users u ON b.user_id = u.id
             JOIN rooms r ON b.room_id = r.id
             WHERE b.id = $1`,
            [id]
        );
        return result.rows[0] || null;
    }

    /**
     * Create a new booking
     * @param {Object} bookingData - Booking data
     * @returns {Promise<Object>} Created booking
     */
	static async create(bookingData) {
		try {
			console.log('🔍 [Booking.create] START');
			console.log('📝 Booking data:', bookingData);

			const { user_id, room_id, check_in_date, check_out_date, total_price, guest_count = 1, special_requests = '' } = bookingData;

			// Check if room is available
			console.log('🔍 [Booking.create] Checking availability...');
			const isAvailable = await this.isRoomAvailable(room_id, check_in_date, check_out_date);
			if (!isAvailable) {
				console.log('❌ [Booking.create] Room not available');
				throw new Error('Room is not available for the selected dates');
			}
			console.log('✅ [Booking.create] Room is available');

			console.log('🔍 [Booking.create] Inserting into database...');
			const result = await pool.query(
				`INSERT INTO bookings (user_id, room_id, check_in_date, check_out_date, total_price, status, guest_count, special_requests)
				 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
				 RETURNING *`,
				[user_id, room_id, check_in_date, check_out_date, total_price, 'pending', guest_count, special_requests]
			);
			console.log('✅ [Booking.create] Booking inserted:', result.rows[0].id);
			return result.rows[0];
		} catch (error) {
			console.error('❌ [Booking.create] ERROR:', error);
			throw error;
		}
	}

    /**
     * Update booking status
     * @param {string} id - Booking's UUID
     * @param {string} status - 'pending'|'confirmed'|'cancelled'|'completed'
     * @returns {Promise<Object|null>} Updated booking or null
     */
    static async updateStatus(id, status) {
        const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
        if (!validStatuses.includes(status)) {
            throw new Error('Invalid status');
        }

        const result = await pool.query(
            `UPDATE bookings 
             SET status = $1, updated_at = CURRENT_TIMESTAMP
             WHERE id = $2
             RETURNING *`,
            [status, id]
        );
        return result.rows[0] || null;
    }

    /**
     * Confirm booking (after payment)
     * @param {string} id - Booking's UUID
     * @param {string} stripePaymentIntentId - Stripe payment intent ID
     * @returns {Promise<Object>} Updated booking
     */
    static async confirm(id, stripePaymentIntentId) {
        const result = await pool.query(
            `UPDATE bookings 
             SET status = 'confirmed', 
                 stripe_payment_intent_id = $1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $2
             RETURNING *`,
            [stripePaymentIntentId, id]
        );
        return result.rows[0] || null;
    }

    /**
     * Cancel booking
     * @param {string} id - Booking's UUID
     * @param {string} reason - Cancellation reason
     * @returns {Promise<Object>} Updated booking
     */
    static async cancel(id, reason = 'Cancelled by user') {
		try {
			// Folosește COALESCE pentru a trata NULL
			const result = await pool.query(
				`UPDATE bookings 
				 SET status = 'cancelled', 
					 special_requests = COALESCE(special_requests, '') || ' | Cancelled: ' || $1,
					 updated_at = CURRENT_TIMESTAMP
				 WHERE id = $2
				 RETURNING *`,
				[reason, id]
			);
			
			console.log(`✅ Booking ${id} cancelled`); // Debug
			return result.rows[0] || null;
		} catch (error) {
			console.error('❌ Cancel booking DB error:', error);
			throw error;
		}
	}

    /**
     * Check if room is available for date range
     * @param {string} roomId - Room's UUID
     * @param {string} checkIn - Check-in date
     * @param {string} checkOut - Check-out date
     * @param {string} excludeBookingId - Booking ID to exclude (for updates)
     * @returns {Promise<boolean>} True if available
     */
    static async isRoomAvailable(roomId, checkIn, checkOut, excludeBookingId = null) {
        let query = `
            SELECT COUNT(*) as count
            FROM bookings
            WHERE room_id = $1
              AND status != 'cancelled'
              AND (
                  (check_in_date <= $3 AND check_out_date > $2) OR
                  (check_in_date < $3 AND check_out_date >= $2) OR
                  (check_in_date >= $2 AND check_out_date <= $3)
              )
        `;
        const values = [roomId, checkIn, checkOut];
        
        if (excludeBookingId) {
            query += ` AND id != $4`;
            values.push(excludeBookingId);
        }

        const result = await pool.query(query, values);
        return parseInt(result.rows[0].count) === 0;
    }

    /**
     * Get total revenue for a period
     * @param {string} fromDate - Start date
     * @param {string} toDate - End date
     * @param {string} status - Booking status (default: 'confirmed')
     * @returns {Promise<number>} Total revenue
     */
    static async getRevenue(fromDate, toDate, status = 'confirmed') {
        const result = await pool.query(
            `SELECT SUM(total_price)::numeric(10,2) as total
             FROM bookings
             WHERE status = $1
               AND check_in_date >= $2
               AND check_out_date <= $3`,
            [status, fromDate, toDate]
        );
        return parseFloat(result.rows[0].total) || 0;
    }

    /**
     * Get bookings count by status
     * @returns {Promise<Object>} Counts by status
     */
    static async getStatusCounts() {
        const result = await pool.query(
            `SELECT status, COUNT(*) as count
             FROM bookings
             GROUP BY status`
        );
        const counts = {};
        result.rows.forEach(row => {
            counts[row.status] = parseInt(row.count);
        });
        return counts;
    }
}

module.exports = Booking;