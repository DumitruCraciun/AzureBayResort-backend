// backend/test-db-connection.js
const { Pool } = require('pg');
require('dotenv').config();

const testConnection = async () => {
    console.log('🔍 Testing database connection...');
    console.log('📋 Connection string:', process.env.DATABASE_URL.replace(/:[^:@]*@/, ':****@'));

    try {
        // Opțiunea 1: Cu connection string
        const pool1 = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });
        
        const result1 = await pool1.query('SELECT NOW() as time, version() as version');
        console.log('✅ Connection with URL: Success');
        console.log('   Time:', result1.rows[0].time);
        await pool1.end();

        // Opțiunea 2: Cu parametri separați
        const pool2 = new Pool({
            user: 'postgres',
            password: '4kjxqb8EgrmE1Sod',
            host: 'db.ppgeecqmmbwiyurgnrai.supabase.co',
            port: 5432,
            database: 'postgres',
            ssl: { rejectUnauthorized: false }
        });
        
        const result2 = await pool2.query('SELECT NOW() as time');
        console.log('✅ Connection with parameters: Success');
        console.log('   Time:', result2.rows[0].time);
        await pool2.end();

    } catch (error) {
        console.error('❌ Connection failed:', error.message);
        console.error('   Full error:', error);
    }
};

testConnection();