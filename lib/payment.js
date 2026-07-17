/**
 * ═══════════════════════════════════════════════════════════════════
 *  💳  STRIPE PAYMENT INTEGRATION — NovaMart
 * ═══════════════════════════════════════════════════════════════════
 *
 *  This is the ONLY file you need to edit to enable live payments.
 *
 *  HOW TO ACTIVATE STRIPE PAYMENTS:
 *  ──────────────────────────────────────────────────────────────────
 *  1. Create a free account at https://stripe.com
 *  2. Go to Dashboard → Developers → API Keys
 *  3. Copy your keys and paste them into your .env file:
 *
 *     STRIPE_SECRET_KEY="sk_live_your_key_here"
 *     NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_your_key_here"
 *
 *  4. For webhooks (optional but recommended for order confirmation):
 *     - In Stripe Dashboard → Webhooks → Add endpoint
 *     - URL: https://yourdomain.com/api/webhook/stripe
 *     - Select events: payment_intent.succeeded, payment_intent.failed
 *     - Copy the webhook signing secret to: STRIPE_WEBHOOK_SECRET="whsec_..."
 *
 *  That's it! Payments will go live automatically.
 * ═══════════════════════════════════════════════════════════════════
 */

import Stripe from 'stripe';

// Initialize Stripe with your secret key
// In test mode, use sk_test_... keys. For live, use sk_live_...
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2024-12-18.acacia',
});

/**
 * Create a Stripe Payment Intent
 * Called when customer proceeds to checkout
 *
 * @param {number} amount - Amount in dollars (e.g. 99.99)
 * @param {string} currency - Currency code (default: 'usd')
 * @param {object} metadata - Order metadata (orderId, userId, etc.)
 * @returns {Promise<{clientSecret: string, paymentIntentId: string}>}
 */
export async function createPaymentIntent(amount, currency = 'usd', metadata = {}) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      // Stripe expects amount in smallest currency unit (cents)
      amount: Math.round(amount * 100),
      currency,
      automatic_payment_methods: { enabled: true },
      metadata,
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  } catch (error) {
    console.error('[Stripe] createPaymentIntent error:', error.message);
    throw new Error(`Payment initialization failed: ${error.message}`);
  }
}

/**
 * Verify a completed payment
 * Called after customer completes payment to confirm it succeeded
 *
 * @param {string} paymentIntentId - The Stripe payment intent ID
 * @returns {Promise<{success: boolean, status: string, amount: number}>}
 */
export async function verifyPayment(paymentIntentId) {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    return {
      success: paymentIntent.status === 'succeeded',
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100, // Convert back to dollars
    };
  } catch (error) {
    console.error('[Stripe] verifyPayment error:', error.message);
    throw new Error(`Payment verification failed: ${error.message}`);
  }
}

/**
 * Process a refund for an order
 * Called when admin cancels or refunds an order
 *
 * @param {string} paymentIntentId - The original payment intent ID
 * @param {number|null} amount - Amount to refund in dollars (null = full refund)
 * @returns {Promise<{success: boolean, refundId: string}>}
 */
export async function createRefund(paymentIntentId, amount = null) {
  try {
    const refundData = { payment_intent: paymentIntentId };
    if (amount !== null) {
      refundData.amount = Math.round(amount * 100);
    }

    const refund = await stripe.refunds.create(refundData);

    return {
      success: refund.status === 'succeeded',
      refundId: refund.id,
    };
  } catch (error) {
    console.error('[Stripe] createRefund error:', error.message);
    throw new Error(`Refund failed: ${error.message}`);
  }
}

/**
 * Verify incoming Stripe webhook events
 * Ensures webhooks are genuinely from Stripe (prevents fraud)
 *
 * @param {string} payload - Raw request body
 * @param {string} signature - Stripe-Signature header value
 * @returns {object} Verified Stripe event object
 */
export function constructWebhookEvent(payload, signature) {
  try {
    return stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (error) {
    console.error('[Stripe] Webhook verification failed:', error.message);
    throw new Error(`Webhook verification failed: ${error.message}`);
  }
}

export { stripe };
