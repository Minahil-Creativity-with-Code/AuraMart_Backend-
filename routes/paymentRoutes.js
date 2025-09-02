const express = require('express');
const router = express.Router();

// Hardcoded Stripe secret key for development
const STRIPE_SECRET_KEY = 'abc';

// Check if Stripe is properly configured
if (!STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY is not set');
}

const stripe = require('stripe')(STRIPE_SECRET_KEY);
const Order = require('../models/Order');
const { authenticateToken } = require('../middleware/auth');

// Create payment intent for Stripe
router.post('/create-payment-intent', async (req, res) => {
  try {
    // Check if Stripe is properly configured
    if (!STRIPE_SECRET_KEY) {
      return res.status(500).json({ 
        error: 'Stripe is not configured. Please add STRIPE_SECRET_KEY to your environment variables.' 
      });
    }

    const { amount, currency = 'pkr' } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        integration_check: 'accept_a_payment',
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    
    // Provide helpful error messages
    if (error.message.includes('apiKey')) {
      return res.status(500).json({ 
        error: 'Stripe API key is invalid or missing. Please check your environment configuration.' 
      });
    }
    
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Confirm payment and update order
router.post('/confirm-payment', async (req, res) => {
  try {
    const { orderId, paymentIntentId, paymentMethod } = req.body;

    if (!orderId || !paymentIntentId) {
      return res.status(400).json({ error: 'Order ID and payment intent ID are required' });
    }

    // Verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status === 'succeeded') {
      // Update order with payment success
      const updatedOrder = await Order.findByIdAndUpdate(
        orderId,
        {
          paymentStatus: 'Paid',
          paymentMethod: paymentMethod || 'Stripe',
          paymentIntentId: paymentIntentId,
          status: 'Processing' // Move to processing after successful payment
        },
        { new: true }
      );

      if (!updatedOrder) {
        return res.status(404).json({ error: 'Order not found' });
      }

      res.json({
        success: true,
        message: 'Payment confirmed successfully',
        order: updatedOrder
      });
    } else {
      res.status(400).json({ error: 'Payment not completed' });
    }
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
});

// Webhook to handle Stripe events (for production)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('Payment succeeded:', paymentIntent.id);
      
      // Update order status if needed
      if (paymentIntent.metadata.orderId) {
        await Order.findByIdAndUpdate(
          paymentIntent.metadata.orderId,
          {
            paymentStatus: 'Paid',
            status: 'Processing'
          }
        );
      }
      break;
      
    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('Payment failed:', failedPayment.id);
      
      // Update order status if needed
      if (failedPayment.metadata.orderId) {
        await Order.findByIdAndUpdate(
          failedPayment.metadata.orderId,
          {
            paymentStatus: 'Failed'
          }
        );
      }
      break;
      
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

module.exports = router;
