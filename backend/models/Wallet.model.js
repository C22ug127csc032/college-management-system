import mongoose from 'mongoose';

const walletSchema = new mongoose.Schema({
  student:  { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, unique: true },
  balance:  { type: Number, default: 0 },
  transactions: [{
    type:        { type: String, enum: ['credit', 'debit'] },
    amount:      { type: Number },
    description: { type: String },
    date:        { type: Date, default: Date.now },
    reference:   { type: String },
  }],
}, { timestamps: true });

export default mongoose.model('Wallet', walletSchema);