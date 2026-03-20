import mongoose from 'mongoose';

const shopItemSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  code:         { type: String, unique: true, uppercase: true, trim: true, sparse: true },
  price:        { type: Number, required: true, min: 0 },
  unit:         { type: String, default: 'piece' },
  stock:        { type: Number, default: 0 },
  minStockAlert:{ type: Number, default: 5 },
  type:         { type: String, enum: ['shop', 'canteen'], required: true },
  isAvailable:  { type: Boolean, default: true },
  createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export default mongoose.model('ShopItem', shopItemSchema);
