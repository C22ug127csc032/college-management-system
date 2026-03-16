import mongoose from 'mongoose';

const checkInSchema = new mongoose.Schema({
  student:      { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  type:         { type: String, enum: ['check_in', 'check_out'], required: true },
  location:     { type: String, enum: ['hostel', 'campus', 'gate'], default: 'gate' },
  timestamp:    { type: Date, default: Date.now },
  remarks:      { type: String },
  recordedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  parentNotified:{ type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('CheckIn', checkInSchema);
