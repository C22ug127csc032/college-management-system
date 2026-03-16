import mongoose from 'mongoose';

const parentSchema = new mongoose.Schema({
  name:      { type: String, required: true },
  phone:     { type: String, required: true, unique: true },
  email:     { type: String },
  password:  { type: String, required: true },
  relation:  { type: String, enum: ['father', 'mother', 'guardian'], default: 'father' },
  students:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  userRef:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isActive:  { type: Boolean, default: true },
  otp:       { type: String },
  otpExpire: { type: Date },
}, { timestamps: true });

export default mongoose.model('Parent', parentSchema);