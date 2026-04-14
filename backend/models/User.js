import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  user_id: { type: Number, unique: true },
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  password_hash: { type: String },
  role: { type: String, default: 'PASSENGER' }
});

export default mongoose.model('User', userSchema);
