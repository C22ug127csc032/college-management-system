import mongoose from 'mongoose';

const saleSchema = new mongoose.Schema({
  billNo:   { type: String, unique: true },
  student:  { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  operator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type:     { type: String, enum: ['shop', 'canteen'], required: true },
  items: [{
    item:      { type: mongoose.Schema.Types.ObjectId, ref: 'ShopItem' },
    name:      { type: String },
    qty:       { type: Number },
    unitPrice: { type: Number },
    total:     { type: Number },
  }],
  totalAmount:  { type: Number, required: true },
  paymentMode:  { type: String, enum: ['wallet', 'cash'], default: 'wallet' },
  date:         { type: Date, default: Date.now },
}, { timestamps: true });

// Auto generate bill no before save
saleSchema.pre('save', async function (next) {
  if (!this.billNo) {
    const count = await mongoose.model('Sale').countDocuments();
    const prefix = this.type === 'canteen' ? 'CNT' : 'SHP';
    const year   = new Date().getFullYear().toString().slice(-2);
    this.billNo  = `${prefix}${year}${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

export default mongoose.model('Sale', saleSchema);