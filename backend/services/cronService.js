import cron from 'node-cron';
import Ticket from '../models/Ticket.js';
import * as paymentService from './paymentService.js';

export const startExpiryRefundWorker = () => {
  cron.schedule('* * * * *', async () => {
    try {
      console.log('--- Checking for expired tickets to refund ---');
      
      const expiredTickets = await Ticket.find({
        status: 'VALID',
        expiry_time: { $lt: new Date() },
        payment_id: { $ne: null }
      });

      for (const ticket of expiredTickets) {
        console.log(`Processing auto-refund for ticket: ${ticket._id}`);
        await paymentService.refundExpiredTicket(
          ticket._id, 
          ticket.payment_id, 
          ticket.fare
        );
        console.log(`Successfully refunded ₹${ticket.fare} for ticket ${ticket._id}`);
      }
      
    } catch (err) {
      console.error('Error in ExpiryRefundWorker:', err.message);
    }
  });
};
