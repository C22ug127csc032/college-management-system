import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name:       { type: String, required: true, trim: true },
  email:      { type: String, unique: true, sparse: true, lowercase: true },
  phone:      { type: String, required: true, unique: true },
  password:   { type: String, required: true },
  role: {
    type: String,
    enum: ['super_admin', 'class_teacher', 'hostel_warden', 'shop_operator', 'canteen_operator', 'librarian', 'student'],
    default: 'student'
  },
  isActive:   { type: Boolean, default: true },
  avatar:     { type: String },
  studentRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  staffId:    { type: String },
  department: { type: String },
  otp:        { type: String },
  otpExpire:  { type: Date },
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = async function(entered) {
  return await bcrypt.compare(entered, this.password);
};

export default mongoose.model('User', userSchema);
