const mongoose = require('mongoose');

const feeHeadSchema = new mongoose.Schema({
  headName:   { type: String, required: true },
  amount:     { type: Number, required: true },
  isOptional: { type: Boolean, default: false },
});

const installmentSchema = new mongoose.Schema({
  installmentNo: { type: Number },
  dueDate:       { type: Date, required: true },
  amount:        { type: Number, required: true },
  label:         { type: String }, // e.g., "1st Installment"
});

const feesStructureSchema = new mongoose.Schema({
  name:         { type: String, required: true },
  course:       { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  academicYear: { type: String, required: true },
  semester:     { type: Number },

  feeHeads:     [feeHeadSchema],
  totalAmount:  { type: Number },

  hasInstallments: { type: Boolean, default: false },
  installments: [installmentSchema],

  fineEnabled:  { type: Boolean, default: false },
  fineType:     { type: String, enum: ['flat', 'percentage'], default: 'flat' },
  fineAmount:   { type: Number, default: 0 }, // per day or percentage
  fineGraceDays:{ type: Number, default: 0 },

  isActive:     { type: Boolean, default: true },
  createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

feesStructureSchema.pre('save', function(next) {
  this.totalAmount = this.feeHeads.reduce((sum, h) => sum + h.amount, 0);
  next();
});

module.exports = mongoose.model('FeesStructure', feesStructureSchema);
