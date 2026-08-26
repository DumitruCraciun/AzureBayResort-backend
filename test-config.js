// backend/test-config.js
require('dotenv').config();
const { Pool } = require('pg');
const Stripe = require('stripe');

console.log('🔍 Testing Azure Bay Resort Configuration...\n');

// Test Database
const testDatabase = async () => {
    try {
        const pool = new Pool({ connectionString: process.env.DATABASE_URL });
        const result = await pool.query('SELECT NOW() as time, version() as version');
        console.log('✅ Database: Connected');
        console.log(`   Time: ${result.rows[0].time}`);
        await pool.end();
        return true;
    } catch (error) {
        console.error('❌ Database Error:', error.message);
        return false;
    }
};

// Test Stripe
const testStripe = async () => {
    try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        const balance = await stripe.balance.retrieve();
        console.log('✅ Stripe: Connected');
        console.log(`   Balance: ${balance.available[0]?.amount || 0} ${balance.available[0]?.currency || 'usd'}`);
        return true;
    } catch (error) {
        console.error('❌ Stripe Error:', error.message);
        return false;
    }
};

// Test Email (doar verificare configuratie)
const testEmail = () => {
    const required = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASS'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
        console.error('❌ Email: Missing config keys:', missing.join(', '));
        return false;
    }
    
    console.log('✅ Email: Configuration looks good');
    console.log(`   Host: ${process.env.EMAIL_HOST}:${process.env.EMAIL_PORT}`);
    console.log(`   User: ${process.env.EMAIL_USER}`);
    return true;
};

// Run all tests
const runTests = async () => {
    console.log('📋 Checking environment variables:');
    console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`   PORT: ${process.env.PORT}\n`);
    
    const dbOk = await testDatabase();
    const stripeOk = await testStripe();
    const emailOk = testEmail();
    
    console.log('\n📊 Summary:');
    console.log(`   Database: ${dbOk ? '✅' : '❌'}`);
    console.log(`   Stripe: ${stripeOk ? '✅' : '❌'}`);
    console.log(`   Email: ${emailOk ? '✅' : '❌'}`);
    
    if (dbOk && stripeOk && emailOk) {
        console.log('\n🎉 All configurations are correct! You\'re ready to start coding.');
    } else {
        console.log('\n⚠️  Some configurations need attention. Please fix the issues above.');
    }
};

runTests();