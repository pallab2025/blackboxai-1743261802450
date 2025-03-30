const Razorpay = require('razorpay');
const crypto = require('crypto');
const config = require('../config/env');

// Initialize Razorpay client
const razorpay = new Razorpay({
  key_id: config.razorpay.key_id,
  key_secret: config.razorpay.key_secret
});

/**
 * Creates a Razorpay order
 * @param {Number} amount - Amount in INR
 * @param {String} receipt - Order receipt identifier
 * @returns {Promise<Object>} Razorpay order object
 */
const createOrder = async (amount, receipt) => {
  try {
    const options = {
      amount: Math.round(amount * 100), // Convert to paise
      currency: 'INR',
      receipt: receipt,
      payment_capture: 1 // Auto-capture payment
    };
    return await razorpay.orders.create(options);
  } catch (err) {
    console.error('Razorpay order creation error:', err);
    throw new Error('Failed to create payment order');
  }
};

/**
 * Verifies payment signature
 * @param {String} orderId - Razorpay order ID
 * @param {String} paymentId - Razorpay payment ID 
 * @param {String} signature - Payment signature to verify
 * @returns {Boolean} True if signature is valid
 */
const verifySignature = (orderId, paymentId, signature) => {
  const generatedSignature = crypto
    .createHmac('sha256', config.razorpay.key_secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return generatedSignature === signature;
};

/**
 * Initiates a refund
 * @param {String} paymentId - Razorpay payment ID
 * @param {Number} amount - Amount to refund in INR
 * @returns {Promise<Object>} Razorpay refund object
 */
const initiateRefund = async (paymentId, amount) => {
  try {
    return await razorpay.payments.refund(paymentId, {
      amount: Math.round(amount * 100) // Convert to paise
    });
  } catch (err) {
    console.error('Razorpay refund error:', err);
    throw new Error('Failed to process refund');
  }
};

module.exports = {
  razorpay,
  createOrder,
  verifySignature,
  initiateRefund
};