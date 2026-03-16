import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  student:      { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  type: {
    type: String,
    enum: ['fee_due', 'payment_confirm', 'leave_status', 'outpass_status', 'checkin', 'circular', 'general'],
    required: true
  },
  title:        { type: String, required: true },
  message:      { type: String, required: true },
  channels:     [{ type: String, enum: ['sms', 'email', 'app'] }],
  smsSent:      { type: Boolean, default: false },
  emailSent:    { type: Boolean, default: false },
  isRead:       { type: Boolean, default: false },
  sentAt:       { type: Date, default: Date.now },
  reference:    { type: String },
}, { timestamps: true });

export default mongoose.model('Notification', notificationSchema);
