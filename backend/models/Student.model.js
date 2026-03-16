import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const studentSchema = new mongoose.Schema({
  regNo: {
    type: String,
    unique: true,
    default: () => 'REG' + Date.now().toString().slice(-8) + Math.floor(Math.random() * 100)
  },

  // Personal Details
  firstName:    { type: String, required: true },
  lastName:     { type: String, required: true },
  dob:          { type: Date },
  gender:       { type: String, enum: ['Male', 'Female', 'Other'] },
  bloodGroup:   { type: String },
  religion:     { type: String },
  category:     { type: String },
  nationality:  { type: String, default: 'Indian' },
  aadharNo:     { type: String },
  photo:        { type: String },
  address: {
    street: String, city: String, state: String, pincode: String
  },

  // Contact
  phone:        { type: String, required: true },
  email:        { type: String },

  // Parent Details
  father: {
    name:       { type: String },
    occupation: { type: String },
    phone:      { type: String },
    email:      { type: String },
  },
  mother: {
    name:       { type: String },
    occupation: { type: String },
    phone:      { type: String },
    email:      { type: String },
  },
  guardian: {
    name:       { type: String },
    relation:   { type: String },
    phone:      { type: String },
    email:      { type: String },
  },

  // Academic
  course:       { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  className:    { type: String },
  section:      { type: String },
  semester:     { type: Number },
  rollNo:       { type: String },
  admissionDate:{ type: Date, default: Date.now },
  academicYear: { type: String },
  batch:        { type: String },

  // Hostel
  isHosteler:   { type: Boolean, default: false },
  hostelRoom:   { type: String },

  // Status
  status:       { type: String, enum: ['active', 'inactive', 'graduated', 'dropped'], default: 'active' },

  userRef:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Advance payment tracking
  advanceAmount: { type: Number, default: 0 },
  advanceAdjusted: { type: Boolean, default: false },

}, { timestamps: true });

studentSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

export default mongoose.model('Student', studentSchema);
