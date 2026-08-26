// backend/src/middleware/admin.js
const { User } = require('../models');

const admin = async (req, res, next) => {
    try {
        // Check if user is set by auth middleware
        if (!req.user) {
            return res.status(401).json({ 
                message: 'Authentication required.' 
            });
        }

        // Check if user is admin
        const isAdmin = await User.isAdmin(req.user.id);
        
        if (!isAdmin) {
            return res.status(403).json({ 
                message: 'Access denied. Admin privileges required.' 
            });
        }

        next();
    } catch (error) {
        console.error('Admin middleware error:', error);
        return res.status(500).json({ 
            message: 'Internal server error during authorization.' 
        });
    }
};

module.exports = admin;