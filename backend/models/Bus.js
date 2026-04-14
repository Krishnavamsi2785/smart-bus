import mongoose from 'mongoose';

const busSchema = new mongoose.Schema({
  bus_id: { type: Number, unique: true },
  bus_code: { type: String, required: true, unique: true },
  bus_number: { type: String, required: true, unique: true },
  depot: { type: String, required: true },
  bus_type: { type: String, default: 'PALLE VELUGU' },
  status: { type: String, default: 'ACTIVE' },
  assigned_routes: [{ type: Number }] // Array of numeric route_ids
});

export default mongoose.model('Bus', busSchema);
