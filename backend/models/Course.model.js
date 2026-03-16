const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  code:        { type: String, required: true, unique: true },
  department:  { type: String },
  duration:    { type: Number }, // in years
  semesters:   { type: Number },
  description: { type: String },
  isActive:    { type: Boolean, default: true },
  classTeacher:{ type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);
