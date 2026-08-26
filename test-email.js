// backend/test-email.js
const nodemailer = require('nodemailer');
require('dotenv').config();

const testEmail = async () => {
    try {
        console.log('📧 Testing email configuration...');
        
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT),
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // Verify connection configuration
        await transporter.verify();
        console.log('✅ Email configuration is correct!');
        
        // Send test email (optional - inlocuieste cu emailul tau)
        const info = await transporter.sendMail({
            from: 'b6a91b001@smtp-brevo.com',
            to: 'azurebayresort.dev@gmail.com', // Înlocuiește cu emailul tău
            subject: 'Azure Bay Resort - Test Email',
            text: 'This is a test email from Azure Bay Resort!',
            html: '<h1>Azure Bay Resort</h1><p>This is a test email!</p>',
        });
        
        console.log('✅ Test email sent!');
        console.log(`   Message ID: ${info.messageId}`);
        console.log(`   To: ${info.envelope.to}`);
    } catch (error) {
        console.error('❌ Email error:', error.message);
        console.error('   Please check your EMAIL_PASS and EMAIL_USER in .env');
    }
};

testEmail();