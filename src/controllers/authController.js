// backend/src/controllers/authController.js
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const generateToken = (userId) => {
    return jwt.sign(
        { id: userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
};

const register = async (req, res) => {
	console.log('🔥 Register endpoint called'); 
    console.log('📝 Request body:', req.body); 
	
    try {
        const { email, password, full_name, phone } = req.body;
		console.log('📧 Email:', email);
		
        // Check if user already exists
        const existingUser = await User.findByEmail(email);		
		console.log('👤 Existing user found:', existingUser ? 'YES' : 'NO');
		
        if (existingUser) {
			console.log('❌ User already exists');
            return res.status(409).json({
                message: 'User with this email already exists. Please login.'
            });
        }

        // Create new user
		console.log('🔄 Creating new user...');
        const user = await User.create({
            email,
            password,
            full_name,
            phone
        });
		console.log('✅ User created:', user);

        // Generate token
        const token = generateToken(user.id);
		console.log('🔑 Token generated');

        // Remove password from response
        delete user.password_hash;

		console.log('✅ Registration successful!');
        res.status(201).json({
            message: 'User registered successfully!',
            user,
            token
        });

    } catch (error) {
        console.error('❌ Registration error:', error);
        console.error('❌ Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Registration failed. Please try again later.',
            error: error.message
        });
    }
};

const login = async (req, res) => {
	console.log('🔥🔥🔥 LOGIN FUNCTION CALLED');
    console.log('📝 Request body:', req.body);
	
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({
                message: 'Invalid email or password.'
            });
        }

        // Verify password
        const isValidPassword = await User.verifyPassword(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({
                message: 'Invalid email or password.'
            });
        }

        // Generate token
        const token = generateToken(user.id);

        // Remove password from response
        delete user.password_hash;

        res.json({
            message: 'Login successful!',
            user,
            token
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            message: 'Login failed. Please try again later.'
        });
    }
};

const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({
                message: 'User not found.'
            });
        }

        res.json({ user });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            message: 'Failed to get profile. Please try again later.'
        });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { full_name, phone } = req.body;

        const updatedUser = await User.update(req.userId, { full_name, phone });
        if (!updatedUser) {
            return res.status(404).json({
                message: 'User not found.'
            });
        }

        res.json({
            message: 'Profile updated successfully!',
            user: updatedUser
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            message: 'Failed to update profile. Please try again later.'
        });
    }
};

const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Get user with password hash
        const user = await User.findByEmail(req.user.email);
        if (!user) {
            return res.status(404).json({
                message: 'User not found.'
            });
        }

        // Verify current password
        const isValidPassword = await User.verifyPassword(currentPassword, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({
                message: 'Current password is incorrect.'
            });
        }

        // Update password
        await User.updatePassword(req.userId, newPassword);

        res.json({
            message: 'Password changed successfully!'
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            message: 'Failed to change password. Please try again later.'
        });
    }
};

const logout = (req, res) => {
    // For JWT, logout is client-side (discard token)
    res.json({
        message: 'Logged out successfully. Please discard your token.'
    });
};

const refreshToken = async (req, res) => {
    try {
        // For simplicity, we generate a new token with the same user
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({
                message: 'User not found.'
            });
        }

        const newToken = generateToken(user.id);

        res.json({
            message: 'Token refreshed successfully!',
            token: newToken
        });

    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(500).json({
            message: 'Failed to refresh token. Please try again later.'
        });
    }
};

module.exports = {
    register,
    login,
    getProfile,
    updateProfile,
    changePassword,
    logout,
    refreshToken
};