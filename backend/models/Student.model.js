import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({

  // ── Register No ──────────────────────────────────────────────────────────
  // Auto generated on creation. Admin can update after university enrollment.
  regNo: {
    type:    String,
    unique:  true,
    sparse:  true,
  },
  admissionNo: {
    type:    String,
    unique:  true,
    sparse:  true,
  },

  // ── Personal Details ─────────────────────────────────────────────────────
  firstName:   { type: String, required: true, trim: true },
  lastName:    { type: String, required: true, trim: true },
  dob:         { type: Date },
  gender:      { type: String, enum: ['Male', 'Female', 'Other'] },
  bloodGroup:  { type: String },
  religion:    { type: String },
  category:    { type: String, enum: ['General', 'OBC', 'SC', 'ST', 'EWS'] },
  nationality: { type: String, default: 'Indian' },
  aadharNo:    { type: String },
  photo:       { type: String },
  address: {
    street:  String,
    city:    String,
    state:   String,
    pincode: String,
  },

  // ── Contact ──────────────────────────────────────────────────────────────
  phone: { type: String, required: true, unique: true },
  email: { type: String },

  // ── Parent Details ───────────────────────────────────────────────────────
  // email removed — not needed, OTP uses phone number
  father: {
    name:       { type: String },
    phone:      { type: String }, // ← used for parent OTP registration
    occupation: { type: String },
  },
  mother: {
    name:       { type: String },
    phone:      { type: String }, // ← backup contact
    occupation: { type: String },
  },
  guardian: {
    name:     { type: String },
    relation: { type: String },
    phone:    { type: String },
  },

  // Annual income — useful for scholarship records
  annualIncome: {
    type: String,
    enum: ['', 'below_1L', '1L_3L', '3L_6L', '6L_10L', 'above_10L'],
    default: '',
  },

  // ── Academic Details ─────────────────────────────────────────────────────
  course:        { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  className:     { type: String },
  section:       { type: String },
  semester:      { type: Number },
  rollNo:        { type: String },
  admissionDate: { type: Date, default: Date.now },
  academicYear:  { type: String },
  batch:         { type: String },
  admissionType: {
    type: String,
    enum: ['management', 'government', 'nri', 'lateral'],
    default: 'management',
  },

  // ── Hostel ───────────────────────────────────────────────────────────────
  isHosteler: { type: Boolean, default: false },
  hostelRoom:  { type: String },

  // ── Status ───────────────────────────────────────────────────────────────
  // admission_pending = admitted but reg no not yet assigned by university
  status: {
    type: String,
    enum: ['active', 'inactive', 'graduated', 'dropped', 'admission_pending'],
    default: 'admission_pending', // ← starts as pending until reg no assigned
  },

  // ── References ───────────────────────────────────────────────────────────
  userRef: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // ── Finance ──────────────────────────────────────────────────────────────
  advanceAmount:   { type: Number, default: 0 },
  advanceAdjusted: { type: Boolean, default: false },

  // ── Parent Registration OTP ──────────────────────────────────────────────
  // Temporary OTP storage for secure parent registration
  parentRegOTP:       { type: String },
  parentRegOTPExpire: { type: Date },

}, { timestamps: true });

// Virtual — full name
studentSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

export default mongoose.model('Student', studentSchema);
