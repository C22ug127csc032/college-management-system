const mongoose = require('mongoose');

const ledgerSchema = new mongoose.Schema({
  student:    { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  type: {
    type: String,
    enum: ['debit', 'credit'],
    required: true
  },
  category: {
    type: String,
    enum: ['fee_billed', 'payment_received', 'fine', 'advance', 'refund', 'adjustment'],
    required: true
  },
  amount:     { type: Number, required: true },
  balance:    { type: Number }, // running balance
  description:{ type: String },
  reference:  { type: String }, // payment/invoice ref
  paymentRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  feesRef:    { type: mongoose.Schema.Types.ObjectId, ref: 'StudentFees' },
  academicYear:{ type: String },
  date:       { type: Date, default: Date.now },
  createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Ledger', ledgerSchema);
