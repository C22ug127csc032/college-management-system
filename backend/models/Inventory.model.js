import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, unique: true, trim: true, uppercase: true },
  category: {
    type: String,
    enum: ['academic', 'hostel', 'general_stocks', 'shop', 'canteen'],
    default: 'academic',
  },
  unit: { type: String, default: 'pcs', trim: true },
  description: { type: String, trim: true },
  openingStock: { type: Number, default: 0 },
  currentStock: { type: Number, default: 0 },
  minStockAlert: { type: Number, default: 5 },
  purchasePrice: { type: Number, default: 0 },
  sellingPrice: { type: Number, default: 0 },
  supplier: { type: String, trim: true },
  location: { type: String, trim: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const inventoryTransactionSchema = new mongoose.Schema({
  inventory: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true },
  type: { type: String, enum: ['bulk_purchase'], default: 'bulk_purchase' },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  vendorName: { type: String, required: true, trim: true },
  vendorPhone: { type: String, trim: true },
  invoiceNo: { type: String, trim: true },
  date: { type: Date, default: Date.now },
  remarks: { type: String, trim: true },
  reference: { type: String, trim: true },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export const Inventory = mongoose.model('Inventory', inventorySchema);
export const InventoryTransaction = mongoose.model('InventoryTransaction', inventoryTransactionSchema);
