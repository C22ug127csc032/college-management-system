import mongoose from 'mongoose';

const outpassSchema = new mongoose.Schema({
  student:       { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  requestedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  exitDate:      { type: Date, required: true },
  exitTime:      { type: String },
  expectedReturn:{ type: Date, required: true },
  actualReturn:  { type: Date },
  reason:        { type: String, required: true },
  destination:   { type: String },

  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'returned'],
    default: 'pending'
  },
  approvedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt:    { type: Date },
  remarks:       { type: String },

  parentNotified:{ type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('Outpass', outpassSchema);
