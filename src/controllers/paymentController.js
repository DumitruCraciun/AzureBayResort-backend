// backend/src/controllers/paymentController.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Booking, Room } = require('../models');
const pool = require('../config/database');

const createPaymentIntent = async (req, res) => {
    try {
        const { bookingId } = req.body;
        const userId = req.userId;

        // Get booking details
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({
                message: 'Booking not found.'
            });
        }

        // Check if user owns this booking
        if (booking.user_id !== userId) {
            return res.status(403).json({
                message: 'You do not have permission to pay for this booking.'
            });
        }

        // Check if booking is already paid
        if (booking.status === 'confirmed') {
            return res.status(400).json({
                message: 'This booking has already been confirmed.'
            });
        }

        if (booking.status === 'cancelled') {
            return res.status(400).json({
                message: 'Cannot pay for a cancelled booking.'
            });
        }

        // Create Stripe Payment Intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(booking.total_price * 100), // Convert to cents/pence
            currency: 'gbp',
            metadata: {
                bookingId: booking.id,
                userId: userId,
                roomId: booking.room_id
            },
            description: `Booking for ${booking.room_type} - ${booking.check_in_date} to ${booking.check_out_date}`
        });

        // Update booking with payment intent ID
        await pool.query(
            `UPDATE bookings 
             SET stripe_payment_intent_id = $1
             WHERE id = $2`,
            [paymentIntent.id, booking.id]
        );

        res.json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency
        });

    } catch (error) {
        console.error('Create payment intent error:', error);
        res.status(500).json({
            message: 'Failed to create payment. Please try again later.'
        });
    }
};

const confirmBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const userId = req.userId;

        // Get booking
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({
                message: 'Booking not found.'
            });
        }

        // Check ownership
        if (booking.user_id !== userId) {
            return res.status(403).json({
                message: 'You do not have permission to confirm this booking.'
            });
        }

        // Check if booking has payment intent
        if (!booking.stripe_payment_intent_id) {
            return res.status(400).json({
                message: 'No payment found for this booking.'
            });
        }

        // Verify payment with Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(
            booking.stripe_payment_intent_id
        );

        if (paymentIntent.status !== 'succeeded') {
            return res.status(400).json({
                message: 'Payment has not been completed. Please complete payment first.'
            });
        }

        // Confirm booking
        const confirmedBooking = await Booking.confirm(
            booking.id,
            booking.stripe_payment_intent_id
        );

        res.json({
            message: 'Booking confirmed successfully!',
            booking: confirmedBooking
        });

    } catch (error) {
        console.error('Confirm booking error:', error);
        res.status(500).json({
            message: 'Failed to confirm booking. Please try again later.'
        });
    }
};

const handleWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log(`📨 Webhook received: ${event.type}`);

    try {
        switch (event.type) {
            case 'payment_intent.succeeded':
                const paymentIntent = event.data.object;
                const bookingId = paymentIntent.metadata.bookingId;
                
                if (bookingId) {
                    // Confirm the booking
                    await Booking.confirm(bookingId, paymentIntent.id);
                    console.log(`✅ Booking ${bookingId} confirmed via webhook`);
                }
                break;

            case 'payment_intent.payment_failed':
                const failedPayment = event.data.object;
                console.log(`❌ Payment failed: ${failedPayment.id}`);
                // Optionally update booking status to 'payment_failed'
                break;

            default:
                console.log(`⚠️ Unhandled event type: ${event.type}`);
        }

        res.json({ received: true });

    } catch (error) {
        console.error('Webhook processing error:', error);
        res.status(500).json({
            message: 'Webhook processing failed.'
        });
    }
};

module.exports = {
    createPaymentIntent,
    confirmBooking,
    handleWebhook
};