import crypto from 'crypto';
import * as paymentService from '../services/paymentService.js';

export const createOrder = async (req, res, next) => {
  try {
    const { amount } = req.body;
    let order = await paymentService.createRazorpayOrder(amount);
    
    // Attach key_id so the frontend can initialize the modal
    if (!order.is_simulator) {
      order = { ...order, key_id: process.env.RAZORPAY_KEY_ID };
    }
    
    res.json({ data: order });
  } catch (err) {
    next(err);
  }
};

export const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    
    // 1. Handle Simulator Mode Success
    if (razorpay_order_id && razorpay_order_id.startsWith('order_sim_')) {
      return res.json({ success: true, message: 'Simulator payment verified' });
    }

    // 2. Real Signature Verification
    const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secret_placeholder');
    shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const expectedSignature = shasum.digest('hex');

    if (expectedSignature === razorpay_signature) {
      res.json({ success: true, message: 'Payment verified' });
    } else {
      res.status(400).json({ success: false, message: 'Invalid signature' });
    }
  } catch (err) {
    next(err);
  }
};
