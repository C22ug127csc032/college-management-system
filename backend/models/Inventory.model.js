const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  name:        { type: String, required: true },
  code:        { type: String, unique: true },
  category:    { type: String, enum: ['academic', 'hostel', 'general', 'lab', 'sports'], default: 'general' },
  unit:        { type: String, default: 'pcs' },
  description: { type: String },

  openingStock:{ type: Number, default: 0 },
  currentStock:{ type: Number, default: 0 },
  minStockAlert:{ type: Number, default: 5 },

  purchasePrice:{ type: Number, default: 0 },
  sellingPrice: { type: Number, default: 0 },

  supplier:    { type: String },
  location:    { type: String },
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });

// Inventory Transaction
const inventoryTransactionSchema = new mongoose.Schema({
  inventory:   { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true },
  type:        { type: String, enum: ['purchase', 'usage', 'adjustment', 'return'], required: true },
  quantity:    { type: Number, required: true },
  unitPrice:   { type: Number },
  totalAmount: { type: Number },
  date:        { type: Date, default: Date.now },
  remarks:     { type: String },
  reference:   { type: String },
  recordedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = {
  Inventory: mongoose.model('Inventory', inventorySchema),
  InventoryTransaction: mongoose.model('InventoryTransaction', inventoryTransactionSchema)
};
