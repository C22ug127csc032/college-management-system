const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  category: {
    type: String,
    enum: ['salary', 'maintenance', 'utilities', 'stationery', 'transport', 'events', 'miscellaneous'],
    required: true
  },
  amount:      { type: Number, required: true },
  date:        { type: Date, default: Date.now },
  description: { type: String },
  paymentMode: { type: String, enum: ['cash', 'bank', 'cheque', 'online'], default: 'cash' },
  receipt:     { type: String },
  approvedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  enteredBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  academicYear:{ type: String },
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);
