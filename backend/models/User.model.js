import mongoose from 'mongoose';
import bcrypt   from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, unique: true, sparse: true, lowercase: true },
  phone:    { type: String, required: true, unique: true },
  password: { type: String, required: true },

  role: {
    type: String,
    enum: [
      'super_admin', 'class_teacher', 'hostel_warden',
      'shop_operator', 'canteen_operator', 'librarian',
      'student', 'parent',
    ],
    default: 'student',
  },

  isActive:     { type: Boolean, default: true },
  avatar:       { type: String },

  // ── First Login Flag ──────────────────────────────────────────────────────
  // true  → student has never logged in before
  //         system forces password change on first login
  // false → student has already set their own password
  isFirstLogin: { type: Boolean, default: false },

  // ── Student reference ─────────────────────────────────────────────────────
  studentRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },

  // ── Parent relation ───────────────────────────────────────────────────────
  // Only used when role = 'parent'
  relation: {
    type: String,
    enum: ['father', 'mother', 'guardian', ''],
    default: '',
  },

  // ── Staff fields ──────────────────────────────────────────────────────────
  staffId:    { type: String },
  department: { type: String },

  // ── OTP fields ────────────────────────────────────────────────────────────
  otp:       { type: String },
  otpExpire: { type: Date },

}, { timestamps: true });

// ── Hash password before save ─────────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ── Compare password ──────────────────────────────────────────────────────────
userSchema.methods.matchPassword = async function (entered) {
  return await bcrypt.compare(entered, this.password);
};

export default mongoose.model('User', userSchema);