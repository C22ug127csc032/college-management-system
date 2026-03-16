import mongoose from 'mongoose';

// Shop/Canteen Item
const shopItemSchema = new mongoose.Schema({
  name:         { type: String, required: true },
  code:         { type: String },
  category:     { type: String },
  type:         { type: String, enum: ['shop', 'canteen'], required: true },
  price:        { type: Number, required: true },
  stock:        { type: Number, default: 0 },
  unit:         { type: String, default: 'pcs' },
  isAvailable:  { type: Boolean, default: true },
}, { timestamps: true });

// Shop/Canteen Sale
const shopSaleSchema = new mongoose.Schema({
  student:      { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  type:         { type: String, enum: ['shop', 'canteen'], required: true },
  items: [{
    item:       { type: mongoose.Schema.Types.ObjectId, ref: 'ShopItem' },
    itemName:   { type: String },
    qty:        { type: Number },
    price:      { type: Number },
    total:      { type: Number },
  }],
  totalAmount:  { type: Number, required: true },
  paymentMode:  { type: String, enum: ['cash', 'credit', 'prepaid'], default: 'cash' },
  status:       { type: String, enum: ['paid', 'credit', 'pending'], default: 'paid' },
  creditDue:    { type: Number, default: 0 },
  billNo:       { type: String },
  date:         { type: Date, default: Date.now },
  operatedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

shopSaleSchema.pre('save', async function(next) {
  if (!this.billNo) {
    const count = await mongoose.model('ShopSale').countDocuments();
    this.billNo = (this.type === 'shop' ? 'SHP' : 'CNT') + Date.now().toString().slice(-6) + (count + 1).toString().padStart(3, '0');
  }
  next();
});

export const ShopItem = mongoose.model('ShopItem', shopItemSchema);
export const ShopSale = mongoose.model('ShopSale', shopSaleSchema);

export default {
  ShopItem,
  ShopSale,
};
