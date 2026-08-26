// backend/src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================
// 1. CORS - Permite toate originile pentru demo
// ============================================
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// ============================================
// 2. Helmet - Configurat pentru cross-origin
// ============================================
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
}));

// ============================================
// 3. Headere suplimentare pentru toate rutele
// ============================================
app.use((req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
});

// ============================================
// 4. Servește imagini cu headere CORS
// ============================================
app.use('/media', (req, res, next) => {
    // Headere specifice pentru imagini
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache 1 an
    next();
}, express.static('media'));

// ============================================
// 5. Restul middleware
// ============================================
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});
app.use('/api', limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// 6. Routes
// ============================================
const authRoutes = require('./routes/authRoutes');
const roomRoutes = require('./routes/roomRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Azure Bay Resort API is running!' });
});

// Test DB
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

app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Azure Bay Resort Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});