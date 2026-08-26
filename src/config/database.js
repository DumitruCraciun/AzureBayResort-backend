// backend/src/config/database.js
const { Pool } = require('pg');
require('dotenv').config();

// Folosește parametrii separați în loc de connection string
const pool = new Pool({
    user: 'postgres',
    password: '4kjxqb8EgrmE1Sod',
    host: 'db.ppgeecqmmbwiyurgnrai.supabase.co',
    port: 6543,
    database: 'postgres',
    ssl: {
        rejectUnauthorized: false // Necesar pentru Supabase
    }
});

// Testează conexiunea la pornire
pool.on('connect', () => {
    console.log('✅ Connected to Supabase PostgreSQL');
});

pool.on('error', (err) => {
    console.error('❌ Unexpected error on idle client', err);
});

module.exports = pool;