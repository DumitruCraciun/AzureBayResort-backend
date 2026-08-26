// backend/src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Import routes
const authRoutes = require('./routes/authRoutes');
const roomRoutes = require('./routes/roomRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
// const adminRoutes = require('./routes/adminRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

// Security middleware
app.use(helmet());
app.use(cors({
    origin: [
        process.env.FRONTEND_URL || 'http://localhost:3000',
        'http://localhost:5173',
        'https://azurebayresort-frontend.onrender.com',
        'https://azurebayresort-frontend.vercel.app' 
    ],
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api', limiter);

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (for room images)
app.use('/media', express.static('media'));

// ===== HEALTH CHECK =====
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Azure Bay Resort API is running!' });
});

// ===== TEST DATABASE CONNECTION =====
app.get('/api/test-db', async (req, res) => {
    try {
        const pool = require('./config/database');
        const result = await pool.query('SELECT NOW() as time, COUNT(*) as room_count FROM rooms');
        res.json({
            success: true,
            time: result.rows[0].time,
            roomCount: parseInt(result.rows[0].room_count)
        });
    } catch (error) {
        console.error('❌ Test DB error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===== TEST ROOMS ENDPOINT =====
app.get('/api/test-rooms', async (req, res) => {
    try {
        const pool = require('./config/database');
        const result = await pool.query('SELECT * FROM rooms LIMIT 5');
        res.json({
            success: true,
            count: result.rows.length,
            rooms: result.rows
        });
    } catch (error) {
        console.error('❌ Test rooms error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===== ROUTES =====
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);
// app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);

// ===== ERROR HANDLING MIDDLEWARE =====
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// ===== 404 HANDLER =====
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, () => {
    console.log(`🚀 Azure Bay Resort Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 API URL: http://localhost:${PORT}/api`);
});