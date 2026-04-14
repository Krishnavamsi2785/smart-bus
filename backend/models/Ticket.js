import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema({
  ticket_uuid: { type: String, required: true, unique: true },
  user_id: { type: Number },
  bus_id: { type: Number },
  route_id: { type: Number },
  from_stop_id: { type: Number },
  to_stop_id: { type: Number },
  fare: { type: Number, required: true },
  issue_time: { type: Date, default: Date.now },
  expiry_time: { type: Date, required: true },
  status: { type: String, default: 'VALID' },
  payment_id: { type: String },
  refund_id: { type: String }
});

export default mongoose.model('Ticket', ticketSchema);
