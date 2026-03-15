const express = require('express');
const router = express.Router();
const PrivateRoom = require('../models/PrivateRoom');
const { protect } = require('../middleware/auth');

// POST /api/payment/create-intent
router.post('/create-intent', protect, async (req, res) => {
  try {
    const { roomId } = req.body;
    const room = await PrivateRoom.findOne({ roomId });
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

    const participantIds = room.participants.map(p => p.toString());
    if (!participantIds.includes(req.user._id.toString()))
      return res.status(403).json({ success: false, message: 'Not authorized' });

    if (room.isPaid)
      return res.status(400).json({ success: false, message: 'Room already unlocked' });

    const amount = parseInt(process.env.PRIVATE_CHAT_PRICE) || 99;

    // Use Stripe if keys are configured
    if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('your_')) {
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: 'usd',
        metadata: { roomId, userId: req.user._id.toString() }
      });
      return res.json({
        success: true,
        clientSecret: paymentIntent.client_secret,
        amount,
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
        mode: 'stripe'
      });
    }

    // Demo mode
    res.json({ success: true, amount, mode: 'demo', message: 'Demo mode — use /demo-unlock endpoint' });
  } catch (error) {
    console.error('Payment intent error:', error);
    res.status(500).json({ success: false, message: 'Payment initialization failed' });
  }
});

// POST /api/payment/confirm
router.post('/confirm', protect, async (req, res) => {
  try {
    const { roomId, paymentIntentId } = req.body;
    let paymentVerified = false;

    if (paymentIntentId && process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('your_')) {
      try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
        paymentVerified = pi.status === 'succeeded';
      } catch (e) {
        console.error('Stripe verify error:', e.message);
      }
    } else {
      paymentVerified = true; // demo mode
    }

    if (!paymentVerified)
      return res.status(400).json({ success: false, message: 'Payment not verified' });

    const room = await PrivateRoom.findOneAndUpdate(
      { roomId },
      {
        isPaid: true,
        'paymentInfo.stripePaymentIntentId': paymentIntentId || 'demo_' + Date.now(),
        'paymentInfo.paidAt': new Date(),
        'paymentInfo.amount': parseInt(process.env.PRIVATE_CHAT_PRICE) || 99,
        'paymentInfo.paidBy': req.user._id
      },
      { new: true }
    );

    res.json({ success: true, message: 'Chat unlocked successfully!', room });
  } catch (error) {
    console.error('Payment confirm error:', error);
    res.status(500).json({ success: false, message: 'Payment confirmation failed' });
  }
});

// POST /api/payment/demo-unlock (for testing without Stripe)
router.post('/demo-unlock', protect, async (req, res) => {
  try {
    const { roomId } = req.body;
    const room = await PrivateRoom.findOneAndUpdate(
      { roomId },
      {
        isPaid: true,
        'paymentInfo.stripePaymentIntentId': 'demo_' + Date.now(),
        'paymentInfo.paidAt': new Date(),
        'paymentInfo.amount': parseInt(process.env.PRIVATE_CHAT_PRICE) || 99,
        'paymentInfo.paidBy': req.user._id
      },
      { new: true }
    );
    res.json({ success: true, message: 'Demo: Chat unlocked!', room });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
