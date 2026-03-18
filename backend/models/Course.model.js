import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  name:            { type: String, required: true },
  code:            { type: String, required: true, unique: true, uppercase: true, trim: true },
  department:      { type: String },
  duration:        { type: Number }, // in years
  semesters:       { type: Number },
  description:     { type: String },
  isActive:        { type: Boolean, default: true },
  classTeacher:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // ── Class Strength Settings ──────────────────────────────────────────────
  maxStrength:     { type: Number, default: 60 }, // max students per section
  sectionsPerYear: { type: Number, default: 2  }, // number of sections (A, B)

}, { timestamps: true });

export default mongoose.model('Course', courseSchema);