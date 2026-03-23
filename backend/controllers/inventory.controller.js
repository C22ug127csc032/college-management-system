import models_Inventory_model from '../models/Inventory.model.js';
const { Inventory, InventoryTransaction } = models_Inventory_model;

const slugifyInventoryName = value =>
  String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24);

const generateInventoryCode = async name => {
  const base = slugifyInventoryName(name) || 'ITEM';
  let attempt = 1;

  while (attempt < 10000) {
    const code = `${base}-${String(attempt).padStart(3, '0')}`;
    const exists = await Inventory.exists({ code });
    if (!exists) return code;
    attempt += 1;
  }

  return `${base}-${Date.now()}`;
};

export const createItem = async (req, res) => {
  try {
    const payload = { ...req.body };
    payload.name = String(payload.name || '').trim();
    payload.code = String(payload.code || '').trim().toUpperCase();

    if (!payload.name) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }

    if (!payload.code) {
      payload.code = await generateInventoryCode(payload.name);
    }

    const numericFields = ['openingStock', 'currentStock', 'minStockAlert', 'purchasePrice', 'sellingPrice'];
    for (const field of numericFields) {
      if (payload[field] === '' || payload[field] === undefined || payload[field] === null) continue;
      payload[field] = Number(payload[field]);
    }

    if (payload.openingStock === undefined && payload.currentStock !== undefined) {
      payload.openingStock = payload.currentStock;
    }
    if (payload.currentStock === undefined && payload.openingStock !== undefined) {
      payload.currentStock = payload.openingStock;
    }

    const item = await Inventory.create(payload);
    res.status(201).json({ success: true, item });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ success: false, message: 'Inventory code already exists. Try again.' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getAllItems = async (req, res) => {
  try {
    const { category, search, lowStock } = req.query;
    const query = {};
    if (category) query.category = category;
    if (search) query.name = { $regex: search, $options: 'i' };
    if (lowStock === 'true') query.$expr = { $lte: ['$currentStock', '$minStockAlert'] };
    const items = await Inventory.find(query).sort('name');
    res.json({ success: true, items });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const getItem = async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    res.json({ success: true, item });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const updateItem = async (req, res) => {
  try {
    const item = await Inventory.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, item });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const addTransaction = async (req, res) => {
  try {
    const { inventoryId, type, quantity, unitPrice, remarks, reference } = req.body;
    const item = await Inventory.findById(inventoryId);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

    if (type === 'purchase') item.currentStock += Number(quantity);
    else if (type === 'usage') {
      if (item.currentStock < quantity) return res.status(400).json({ success: false, message: 'Insufficient stock' });
      item.currentStock -= Number(quantity);
    } else if (type === 'adjustment') {
      item.currentStock = Number(quantity);
    }
    await item.save();

    const txn = await InventoryTransaction.create({
      inventory: inventoryId, type, quantity,
      unitPrice, totalAmount: unitPrice ? unitPrice * quantity : undefined,
      remarks, reference, recordedBy: req.user.id,
    });
    res.status(201).json({ success: true, transaction: txn, item });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const getTransactions = async (req, res) => {
  try {
    const { inventoryId, type, startDate, endDate } = req.query;
    const query = {};
    if (inventoryId) query.inventory = inventoryId;
    if (type) query.type = type;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    const transactions = await InventoryTransaction.find(query)
      .populate('inventory', 'name code unit')
      .sort('-date');
    res.json({ success: true, transactions });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const getInventoryStats = async (req, res) => {
  try {
    const stats = await Inventory.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 }, totalValue: { $sum: { $multiply: ['$currentStock', '$purchasePrice'] } } } }
    ]);
    const lowStockItems = await Inventory.find({ $expr: { $lte: ['$currentStock', '$minStockAlert'] } }).select('name currentStock minStockAlert category');
    res.json({ success: true, stats, lowStockItems });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export default {
  createItem,
  getAllItems,
  getItem,
  updateItem,
  addTransaction,
  getTransactions,
  getInventoryStats,
};
