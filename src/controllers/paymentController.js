// backend/src/controllers/paymentController.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Booking, Room } = require('../models');
const pool = require('../config/database');

const createPaymentIntent = async (req, res) => {
    try {
        const { bookingId } = req.body;
        const userId = req.userId;

        console.log('📝 Creating Checkout Session for booking:', bookingId);

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found.' });
        }

        if (booking.user_id !== userId) {
            return res.status(403).json({ message: 'Unauthorized.' });
        }

        if (booking.status === 'confirmed') {
            return res.status(400).json({ message: 'Booking already confirmed.' });
        }

        if (booking.status === 'cancelled') {
            return res.status(400).json({ message: 'Cannot pay for a cancelled booking.' });
        }

        // 🔥 Creează Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'gbp',
                        product_data: {
                            name: `Azure Bay Resort - ${booking.room_type || 'Room'}`,
                            description: `${booking.check_in_date} to ${booking.check_out_date}`,
                        },
                        unit_amount: Math.round(booking.total_price * 100),
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/booking-confirmation/${booking.id}?success=true`,
            cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/booking/${booking.id}?canceled=true`,
            metadata: {
                bookingId: booking.id,
                userId: userId,
            },
        });

        console.log('✅ Checkout Session created:', session.id);

        // Update booking with session ID
        await pool.query(
            `UPDATE bookings 
             SET stripe_payment_intent_id = $1
             WHERE id = $2`,
            [session.id, booking.id]
        );

        res.json({
            sessionId: session.id,
            url: session.url,
        });

    } catch (error) {
        console.error('❌ Create payment error:', error);
        res.status(500).json({ message: 'Failed to create payment.' });
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