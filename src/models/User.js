// backend/src/models/User.js
const pool = require('../config/database');
const bcrypt = require('bcrypt');

class User {
    /**
     * Find user by email
     * @param {string} email - User's email
     * @returns {Promise<Object|null>} User object or null
     */
    static async findByEmail(email) {
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        return result.rows[0] || null;
    }

    /**
     * Find user by ID
     * @param {string} id - User's UUID
     * @returns {Promise<Object|null>} User object or null
     */
    static async findById(id) {
        const result = await pool.query(
            'SELECT id, email, full_name, phone, role, created_at FROM users WHERE id = $1',
            [id]
        );
        return result.rows[0] || null;
    }

    /**
     * Create a new user
     * @param {Object} userData - { email, password, full_name, phone }
     * @returns {Promise<Object>} Created user object
     */
    static async create(userData) {
        const { email, password, full_name, phone } = userData;
        
        // Hash password
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);

        const result = await pool.query(
            `INSERT INTO users (email, password_hash, full_name, phone, role)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, email, full_name, phone, role, created_at`,
            [email, password_hash, full_name, phone, 'user']
        );
        
        return result.rows[0];
    }

    /**
     * Update user profile
     * @param {string} id - User's UUID
     * @param {Object} updates - { full_name, phone }
     * @returns {Promise<Object>} Updated user object
     */
    static async update(id, updates) {
        const { full_name, phone } = updates;
        
        const result = await pool.query(
            `UPDATE users 
             SET full_name = $1, phone = $2, updated_at = CURRENT_TIMESTAMP
             WHERE id = $3
             RETURNING id, email, full_name, phone, role, created_at`,
            [full_name, phone, id]
        );
        
        return result.rows[0] || null;
    }

    /**
     * Update user password
     * @param {string} id - User's UUID
     * @param {string} newPassword - New plain text password
     * @returns {Promise<boolean>} Success status
     */
    static async updatePassword(id, newPassword) {
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(newPassword, saltRounds);
        
        const result = await pool.query(
            'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [password_hash, id]
        );
        
        return result.rowCount > 0;
    }

    /**
     * Verify user password
     * @param {string} password - Plain text password
     * @param {string} hash - Hashed password from database
     * @returns {Promise<boolean>} True if password matches
     */
    static async verifyPassword(password, hash) {
        return await bcrypt.compare(password, hash);
    }

    /**
     * Get all bookings for a user
     * @param {string} userId - User's UUID
     * @returns {Promise<Array>} List of bookings
     */
    static async getBookings(userId) {
        const result = await pool.query(
            `SELECT b.*, r.room_number, r.room_type, r.price_per_night
             FROM bookings b
             JOIN rooms r ON b.room_id = r.id
             WHERE b.user_id = $1
             ORDER BY b.created_at DESC`,
            [userId]
        );
        return result.rows;
    }

    /**
     * Check if user is admin
     * @param {string} userId - User's UUID
     * @returns {Promise<boolean>} True if admin
     */
    static async isAdmin(userId) {
        const result = await pool.query(
            'SELECT role FROM users WHERE id = $1',
            [userId]
        );
        return result.rows[0]?.role === 'admin';
    }

    /**
     * Delete user (soft delete or hard delete)
     * @param {string} id - User's UUID
     * @returns {Promise<boolean>} Success status
     */
    static async delete(id) {
        // For now, hard delete (cascade will handle related records)
        const result = await pool.query(
            'DELETE FROM users WHERE id = $1',
            [id]
        );
        return result.rowCount > 0;
    }
}

module.exports = User;