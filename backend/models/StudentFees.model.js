import mongoose from 'mongoose';

const studentFeesSchema = new mongoose.Schema({
  student:      { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  structure:    { type: mongoose.Schema.Types.ObjectId, ref: 'FeesStructure' },
  academicYear: { type: String, required: true },
  semester:     { type: Number },

  feeHeads: [{
    headName:  { type: String },
    amount:    { type: Number },
    paid:      { type: Number, default: 0 },
    due:       { type: Number },
  }],

  totalAmount:  { type: Number, required: true },
  totalPaid:    { type: Number, default: 0 },
  totalDue:     { type: Number },
  totalFine:    { type: Number, default: 0 },

  status: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'overdue'],
    default: 'pending'
  },

  dueDate:      { type: Date },
  advanceAdjusted: { type: Number, default: 0 },

  assignedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

studentFeesSchema.pre('save', function(next) {
  this.totalDue = Math.max(this.totalAmount + this.totalFine - this.totalPaid - this.advanceAdjusted, 0);
  if (this.totalDue === 0) this.status = 'paid';
  else if (this.totalPaid > 0) this.status = 'partial';
  next();
});

export default mongoose.model('StudentFees', studentFeesSchema);
