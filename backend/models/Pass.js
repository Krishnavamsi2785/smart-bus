import mongoose from 'mongoose';

const passSchema = new mongoose.Schema({
  pass_id: { type: String, required: true, unique: true },
  user_id: { type: String, required: true },
  pass_type: { type: String, enum: ['SILVER', 'GOLD', 'PLATINUM'], required: true },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'ACTIVE', 'EXPIRED', 'PENDING_RENEWAL'], default: 'PENDING' },
  duration: { type: Number, required: true }, // in months
  price: { type: Number, required: true },
  depot_id: { type: String, required: true }, // Routes to Depot for validation
  
  // Route data
  route_id: { type: Number, required: true },
  from_stop: { type: String, required: true },
  to_stop: { type: String, required: true },
  
  // Applicant details
  applicant_details: {
    full_name: { type: String, required: true },
    phone: { type: String, required: true },
    age: { type: Number },
    // Student specific
    aadhar: { type: String },
    college_name: { type: String },
    father_name: { type: String },
    year_of_study: { type: String }
  },
  
  // Document base64 blocks (Keep minimal sizing in mind)
  documents: {
    passport_photo: { type: String },
    college_cert: { type: String },
    tenth_cert: { type: String }
  },

  valid_from: { type: Date },
  valid_until: { type: Date },
  payment_id: { type: String } // Razorpay payment ID after successful payment
}, {
  timestamps: true
});

const Pass = mongoose.model('Pass', passSchema);
export default Pass;
