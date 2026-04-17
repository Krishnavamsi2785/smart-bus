import mongoose from 'mongoose';

const depotSchema = new mongoose.Schema({
  depot_id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

export default mongoose.model('Depot', depotSchema);
