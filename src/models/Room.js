// backend/src/models/Room.js
const pool = require('../config/database');

class Room {
    /**
     * Get all rooms with optional filters
     * @param {Object} filters - { minPrice, maxPrice, maxOccupancy, features }
     * @returns {Promise<Array>} List of rooms
     */
    static async findAll(filters = {}) {
        let query = `
            SELECT r.*, 
                   (SELECT json_agg(image_url ORDER BY sort_order) 
                    FROM room_images 
                    WHERE room_id = r.id) as images
            FROM rooms r
            WHERE 1=1
        `;
        const values = [];
        let paramCount = 1;

        if (filters.minPrice) {
            query += ` AND r.price_per_night >= $${paramCount}`;
            values.push(filters.minPrice);
            paramCount++;
        }

        if (filters.maxPrice) {
            query += ` AND r.price_per_night <= $${paramCount}`;
            values.push(filters.maxPrice);
            paramCount++;
        }

        if (filters.maxOccupancy) {
            query += ` AND r.max_occupancy >= $${paramCount}`;
            values.push(filters.maxOccupancy);
            paramCount++;
        }

        if (filters.roomType) {
            query += ` AND r.room_type ILIKE $${paramCount}`;
            values.push(`%${filters.roomType}%`);
            paramCount++;
        }

        // Filter by features (array intersection)
        if (filters.features && filters.features.length > 0) {
            query += ` AND r.features && $${paramCount}`;
            values.push(filters.features);
            paramCount++;
        }

        query += ` ORDER BY r.price_per_night ASC`;

        const result = await pool.query(query, values);
        return result.rows;
    }

    /**
     * Find room by ID
     * @param {string} id - Room's UUID
     * @returns {Promise<Object|null>} Room object or null
     */
    static async findById(id) {
        const result = await pool.query(
            `SELECT r.*, 
                    (SELECT json_agg(image_url ORDER BY sort_order) 
                     FROM room_images 
                     WHERE room_id = r.id) as images
             FROM rooms r
             WHERE r.id = $1`,
            [id]
        );
        return result.rows[0] || null;
    }

    /**
     * Find room by room number
     * @param {string} roomNumber - Room number
     * @returns {Promise<Object|null>} Room object or null
     */
    static async findByRoomNumber(roomNumber) {
        const result = await pool.query(
            'SELECT * FROM rooms WHERE room_number = $1',
            [roomNumber]
        );
        return result.rows[0] || null;
    }

    /**
     * Create a new room
     * @param {Object} roomData - Room data
     * @returns {Promise<Object>} Created room
     */
    static async create(roomData) {
        const { room_number, room_type, description, price_per_night, max_occupancy, features } = roomData;

        const result = await pool.query(
            `INSERT INTO rooms (room_number, room_type, description, price_per_night, max_occupancy, features)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [room_number, room_type, description, price_per_night, max_occupancy, features || []]
        );
        return result.rows[0];
    }

    /**
     * Update room
     * @param {string} id - Room's UUID
     * @param {Object} updates - Fields to update
     * @returns {Promise<Object|null>} Updated room or null
     */
    static async update(id, updates) {
        const fields = [];
        const values = [];
        let paramCount = 1;

        const allowedFields = ['room_number', 'room_type', 'description', 'price_per_night', 'max_occupancy', 'features', 'is_available'];
        
        for (const [key, value] of Object.entries(updates)) {
            if (allowedFields.includes(key) && value !== undefined) {
                fields.push(`${key} = $${paramCount}`);
                values.push(value);
                paramCount++;
            }
        }

        if (fields.length === 0) {
            return await Room.findById(id);
        }

        fields.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id);

        const query = `
            UPDATE rooms 
            SET ${fields.join(', ')}
            WHERE id = $${paramCount}
            RETURNING *
        `;

        const result = await pool.query(query, values);
        return result.rows[0] || null;
    }

    /**
     * Check room availability for date range
     * @param {string} roomId - Room's UUID
     * @param {string} checkIn - Check-in date (YYYY-MM-DD)
     * @param {string} checkOut - Check-out date (YYYY-MM-DD)
     * @returns {Promise<boolean>} True if available
     */
    static async isAvailable(roomId, checkIn, checkOut) {
        const result = await pool.query(
            `SELECT COUNT(*) as count
             FROM bookings
             WHERE room_id = $1
               AND status != 'cancelled'
               AND (
                   (check_in_date <= $3 AND check_out_date > $2) OR
                   (check_in_date < $3 AND check_out_date >= $2) OR
                   (check_in_date >= $2 AND check_out_date <= $3)
               )`,
            [roomId, checkIn, checkOut]
        );
        return parseInt(result.rows[0].count) === 0;
    }

    /**
     * Add image to room
     * @param {string} roomId - Room's UUID
     * @param {string} imageUrl - URL of the image
     * @param {boolean} isPrimary - Is this the primary image
     * @param {number} sortOrder - Sort order
     * @returns {Promise<Object>} Created image record
     */
    static async addImage(roomId, imageUrl, isPrimary = false, sortOrder = 0) {
        const result = await pool.query(
            `INSERT INTO room_images (room_id, image_url, is_primary, sort_order)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [roomId, imageUrl, isPrimary, sortOrder]
        );
        return result.rows[0];
    }

    /**
     * Get all reviews for a room
     * @param {string} roomId - Room's UUID
     * @returns {Promise<Array>} List of reviews with user info
     */
    static async getReviews(roomId) {
        const result = await pool.query(
            `SELECT r.*, u.full_name, u.email
             FROM reviews r
             JOIN users u ON r.user_id = u.id
             WHERE r.room_id = $1
             ORDER BY r.created_at DESC`,
            [roomId]
        );
        return result.rows;
    }

    /**
     * Get average rating for a room
     * @param {string} roomId - Room's UUID
     * @returns {Promise<number>} Average rating
     */
    static async getAverageRating(roomId) {
        const result = await pool.query(
            `SELECT AVG(rating)::numeric(10,2) as average, COUNT(*) as count
             FROM reviews
             WHERE room_id = $1`,
            [roomId]
        );
        return {
            average: parseFloat(result.rows[0].average) || 0,
            count: parseInt(result.rows[0].count) || 0
        };
    }

    /**
     * Delete room
     * @param {string} id - Room's UUID
     * @returns {Promise<boolean>} Success status
     */
    static async delete(id) {
        const result = await pool.query(
            'DELETE FROM rooms WHERE id = $1',
            [id]
        );
        return result.rowCount > 0;
    }
}

module.exports = Room;