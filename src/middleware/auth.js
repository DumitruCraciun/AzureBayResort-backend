// backend/src/middleware/auth.js
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const auth = async (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                message: 'Authentication required. Please provide a valid token.' 
            });
        }

        const token = authHeader.split(' ')[1];
        
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from database
        const user = await User.findById(decoded.id);
        
        if (!user) {
            return res.status(401).json({ 
                message: 'User not found. Please login again.' 
            });
        }

        // Attach user to request
        req.user = user;
        req.userId = user.id;
        
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                message: 'Invalid token. Please login again.' 
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                message: 'Token expired. Please login again.' 
            });
        }
        
        console.error('Auth middleware error:', error);
        return res.status(500).json({ 
            message: 'Internal server error during authentication.' 
        });
    }
};

module.exports = auth;