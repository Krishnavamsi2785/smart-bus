import mongoose from 'mongoose';

const stopSchema = new mongoose.Schema({
  stop_id: { type: Number, index: true },
  stop_name: { type: String, required: true },
  stop_order: { type: Number, required: true },
  distance_from_start: { type: Number }
});

const routeSchema = new mongoose.Schema({
  route_id: { type: Number, unique: true },
  route_name: { type: String, required: true },
  start_stop: { type: String, required: true },
  end_stop: { type: String, required: true },
  total_distance: { type: Number },
  stops: [stopSchema]
});

export default mongoose.model('Route', routeSchema);
