const mongoose = require('mongoose');

const circularSchema = new mongoose.Schema({
  title:        { type: String, required: true },
  content:      { type: String, required: true },
  type: {
    type: String,
    enum: ['circular', 'announcement', 'exam_schedule', 'event', 'holiday'],
    default: 'circular'
  },
  audience:     [{ type: String, enum: ['students', 'parents', 'staff', 'all'] }],
  attachments:  [{ type: String }],
  publishDate:  { type: Date, default: Date.now },
  expiryDate:   { type: Date },
  isPublished:  { type: Boolean, default: true },
  course:       { type: mongoose.Schema.Types.ObjectId, ref: 'Course' }, // null = all
  publishedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Circular', circularSchema);
