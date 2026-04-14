import axios from 'axios';

const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY || '';

export const sendTicketSMS = async (phone, ticketDetails) => {
  const { ticket_uuid, passenger_name, bus, bus_type, source, destination, issue_time } = ticketDetails;
  const shortUuid = ticket_uuid.split('-')[0].toUpperCase();
  const dateStr = new Date(issue_time).toLocaleString('en-IN', {
    dateStyle: 'medium', timeStyle: 'short'
  });

  const messageBody =
    `APSRTC TICKET CONFIRMED\n` +
    `Ticket ID: ${shortUuid}\n` +
    `Passenger: ${passenger_name || 'Passenger'}\n` +
    `Bus: ${bus} (${bus_type || 'REGULAR'})\n` +
    `From: ${source}\n` +
    `To: ${destination}\n` +
    `Date/Time: ${dateStr}\n` +
    `Payment Status: Paid\n` +
    `Show this Ticket ID to Conductor. Safe Travels!`;

  // Always log the message so you can verify what would be sent
  console.log('\n--- 📱 SMS NOTIFICATION ---');
  console.log(`To: +91${phone}`);
  console.log(messageBody);
  console.log('---------------------------\n');

  // If no API key, just simulate (no crash)
  if (!FAST2SMS_API_KEY) {
    console.warn('⚠️  FAST2SMS_API_KEY not set in .env — SMS simulated only.');
    console.warn('   Get a free key at https://www.fast2sms.com/');
    return { success: false, mock: true };
  }

  try {
    const response = await axios.post(
      'https://www.fast2sms.com/dev/bulkV2',
      {
        route: 'q',           // Quick transactional route
        message: messageBody,
        language: 'english',
        flash: 0,
        numbers: phone        // 10-digit Indian mobile number (no country code)
      },
      {
        headers: {
          authorization: FAST2SMS_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.return === true) {
      console.log(`✅ SMS sent successfully to ${phone}`);
      return { success: true };
    } else {
      console.error('❌ Fast2SMS error:', response.data.message);
      return { success: false, error: response.data.message };
    }
  } catch (error) {
    console.error(`❌ SMS dispatch failed:`, error.message);
    return { success: false, error: error.message };
  }
};
