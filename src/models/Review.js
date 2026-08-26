// backend/src/models/Review.js
const pool = require('../config/database');

class Review {
    /**
     * Find review by ID
     * @param {string} id - Review's UUID
     * @returns {Promise<Object|null>} Review object or null
     */
    static async findById(id) {
        const result = await pool.query(
            `SELECT r.*, u.full_name as user_name, u.email
             FROM reviews r
             JOIN users u ON r.user_id = u.id
             WHERE r.id = $1`,
            [id]
        );
        return result.rows[0] || null;
    }

    /**
     * Get all reviews for a room
     * @param {string} roomId - Room's UUID
     * @param {number} limit - Limit results
     * @param {number} offset - Pagination offset
     * @returns {Promise<Array>} List of reviews
     */
    static async findByRoom(roomId, limit = 10, offset = 0) {
        const result = await pool.query(
            `SELECT r.*, u.full_name as user_name
             FROM reviews r
             JOIN users u ON r.user_id = u.id
             WHERE r.room_id = $1
             ORDER BY r.created_at DESC
             LIMIT $2 OFFSET $3`,
            [roomId, limit, offset]
        );
        return result.rows;
    }

    /**
     * Get all reviews by a user
     * @param {string} userId - User's UUID
     * @returns {Promise<Array>} List of reviews
     */
    static async findByUser(userId) {
        const result = await pool.query(
            `SELECT r.*, r.room_id, rm.room_number, rm.room_type
             FROM reviews r
             JOIN rooms rm ON r.room_id = rm.id
             WHERE r.user_id = $1
             ORDER BY r.created_at DESC`,
            [userId]
        );
        return result.rows;
    }

    /**
     * Create a new review
     * @param {Object} reviewData - { user_id, room_id, rating, comment }
     * @returns {Promise<Object>} Created review
     */
    static async create(reviewData) {
        const { user_id, room_id, rating, comment } = reviewData;

        // Check if user has booked this room before (and completed stay)
        const hasBooked = await pool.query(
            `SELECT COUNT(*) as count
             FROM bookings
             WHERE user_id = $1 
               AND room_id = $2 
               AND status = 'completed'`,
            [user_id, room_id]
        );

        if (parseInt(hasBooked.rows[0].count) === 0) {
            throw new Error('User must have completed a booking for this room to leave a review');
        }

        // Check if user already reviewed this room
        const existingReview = await pool.query(
            `SELECT id FROM reviews WHERE user_id = $1 AND room_id = $2`,
            [user_id, room_id]
        );

        if (existingReview.rows.length > 0) {
            throw new Error('User has already reviewed this room');
        }

        const result = await pool.query(
            `INSERT INTO reviews (user_id, room_id, rating, comment)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [user_id, room_id, rating, comment]
        );
        return result.rows[0];
    }

    /**
     * Update a review
     * @param {string} id - Review's UUID
     * @param {Object} updates - { rating, comment }
     * @returns {Promise<Object|null>} Updated review or null
     */
    static async update(id, updates) {
        const { rating, comment } = updates;
        
        const result = await pool.query(
            `UPDATE reviews 
             SET rating = $1, comment = $2
             WHERE id = $3
             RETURNING *`,
            [rating, comment, id]
        );
        return result.rows[0] || null;
    }

    /**
     * Delete a review
     * @param {string} id - Review's UUID
     * @param {string} userId - User's UUID (to verify ownership)
     * @returns {Promise<boolean>} Success status
     */
    static async delete(id, userId = null) {
        let query = 'DELETE FROM reviews WHERE id = $1';
        const params = [id];

        if (userId) {
            query += ' AND user_id = $2';
            params.push(userId);
        }

        const result = await pool.query(query, params);
        return result.rowCount > 0;
    }

    /**
     * Check if user can review a room
     * @param {string} userId - User's UUID
     * @param {string} roomId - Room's UUID
     * @returns {Promise<boolean>} True if can review
     */
    static async canReview(userId, roomId) {
        // Check if user has completed booking for this room
        const hasBooked = await pool.query(
            `SELECT COUNT(*) as count
             FROM bookings
             WHERE user_id = $1 
               AND room_id = $2 
               AND status = 'completed'`,
            [userId, roomId]
        );

        if (parseInt(hasBooked.rows[0].count) === 0) {
            return false;
        }

        // Check if already reviewed
        const existingReview = await pool.query(
            `SELECT id FROM reviews WHERE user_id = $1 AND room_id = $2`,
            [userId, roomId]
        );

        return existingReview.rows.length === 0;
    }
}

module.exports = Review;