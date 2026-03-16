const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  student:       { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  studentFees:   { type: mongoose.Schema.Types.ObjectId, ref: 'StudentFees' },
  receiptNo:     { type: String, unique: true },

  amount:        { type: Number, required: true },
  paymentDate:   { type: Date, default: Date.now },

  paymentMode: {
    type: String,
    enum: ['online', 'cash', 'cheque', 'dd', 'neft'],
    default: 'online'
  },

  // Razorpay fields
  razorpayOrderId:   { type: String },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },

  status: {
    type: String,
    enum: ['pending', 'success', 'failed', 'refunded'],
    default: 'pending'
  },

  fineAmount:    { type: Number, default: 0 },
  description:   { type: String },
  academicYear:  { type: String },
  semester:      { type: Number },
  isAdvance:     { type: Boolean, default: false },

  collectedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

paymentSchema.pre('save', async function(next) {
  if (!this.receiptNo) {
    const count = await mongoose.model('Payment').countDocuments();
    this.receiptNo = 'RCP' + Date.now().toString().slice(-6) + (count + 1).toString().padStart(4, '0');
  }
  next();
});

module.exports = mongoose.model('Payment', paymentSchema);
