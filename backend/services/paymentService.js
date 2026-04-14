import Razorpay from 'razorpay';
import dotenv from 'dotenv';
import Ticket from '../models/Ticket.js';

dotenv.config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secret_placeholder',
});

export const createRazorpayOrder = async (amount) => {
  if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID === 'rzp_test_placeholder') {
    console.warn('--- RAZORPAY SIMULATOR MODE ACTIVE ---');
    return {
      id: `order_sim_${Date.now()}`,
      amount: amount * 100,
      currency: 'INR',
      is_simulator: true
    };
  }

  const options = {
    amount: amount * 100,
    currency: 'INR',
    receipt: `receipt_${Date.now()}`,
  };
  return await razorpay.orders.create(options);
};

export const refundExpiredTicket = async (ticketId, paymentId, amount) => {
  try {
    if (paymentId === "UPI_SCAN_PAYMENT" || !paymentId.startsWith('pay_')) {
      console.log(`Setting ticket ${ticketId} to EXPIRED (Direct UPI Payment - No Auto Refund)`);
      await Ticket.updateOne({ _id: ticketId }, { status: 'EXPIRED' });
      return { status: 'EXPIRED' };
    }

    const refund = await razorpay.payments.refund(paymentId, {
      amount: amount * 100,
      speed: 'optimum',
      notes: { reason: 'Ticket expired without use' },
    });

    await Ticket.updateOne(
      { _id: ticketId },
      { status: 'REFUNDED', refund_id: refund.id }
    );

    return refund;
  } catch (err) {
    console.error(`Refund failed for ticket ${ticketId}:`, err.message);
    return null;
  }
};
