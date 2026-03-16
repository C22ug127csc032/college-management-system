const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  student:     { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  appliedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // parent or student
  appliedByRole:{ type: String, enum: ['student', 'parent'], default: 'parent' },

  leaveType:   { type: String, enum: ['sick', 'personal', 'emergency', 'other'], default: 'personal' },
  fromDate:    { type: Date, required: true },
  toDate:      { type: Date, required: true },
  noOfDays:    { type: Number },
  reason:      { type: String, required: true },

  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt:  { type: Date },
  remarks:     { type: String },

  attachments: [{ type: String }],
}, { timestamps: true });

leaveSchema.pre('save', function(next) {
  if (this.fromDate && this.toDate) {
    const diff = (this.toDate - this.fromDate) / (1000 * 60 * 60 * 24);
    this.noOfDays = Math.floor(diff) + 1;
  }
  next();
});

module.exports = mongoose.model('Leave', leaveSchema);
