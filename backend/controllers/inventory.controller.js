import { Inventory, InventoryTransaction } from '../models/Inventory.model.js';

const ALLOWED_CATEGORIES = ['academic', 'hostel', 'general_stocks', 'shop', 'canteen'];

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

const toNumber = (value, fallback = 0) => {
  if (value === '' || value === undefined || value === null) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeItemPayload = async (body, options = {}) => {
  const { isCreate = false } = options;
  const payload = {};

  if (body.name !== undefined || isCreate) {
    payload.name = String(body.name || '').trim();
    if (!payload.name) throw new Error('Name is required');
  }

  if (body.category !== undefined || isCreate) {
    const category = String(body.category || 'academic').trim().toLowerCase();
    if (!ALLOWED_CATEGORIES.includes(category)) {
      throw new Error('Category must be Academic, Hostel, or General Stocks');
    }
    payload.category = category;
  }

  if (body.code !== undefined) {
    const code = String(body.code || '').trim().toUpperCase();
    if (code) payload.code = code;
  } else if (isCreate) {
    payload.code = await generateInventoryCode(payload.name);
  }

  const textFields = ['unit', 'description', 'supplier', 'location'];
  for (const field of textFields) {
    if (body[field] !== undefined) {
      payload[field] = String(body[field] || '').trim();
    }
  }

  const numericFields = ['openingStock', 'currentStock', 'minStockAlert', 'purchasePrice', 'sellingPrice'];
  for (const field of numericFields) {
    if (body[field] !== undefined) {
      payload[field] = toNumber(body[field], 0);
    }
  }

  if (isCreate) {
    if (payload.openingStock === undefined && payload.currentStock !== undefined) {
      payload.openingStock = payload.currentStock;
    }
    if (payload.currentStock === undefined && payload.openingStock !== undefined) {
      payload.currentStock = payload.openingStock;
    }
    if (payload.openingStock === undefined) payload.openingStock = 0;
    if (payload.currentStock === undefined) payload.currentStock = payload.openingStock;
    if (payload.minStockAlert === undefined) payload.minStockAlert = 5;
    if (payload.purchasePrice === undefined) payload.purchasePrice = 0;
    if (payload.sellingPrice === undefined) payload.sellingPrice = 0;
    if (!payload.unit) payload.unit = 'pcs';
  }

  return payload;
};

export const createItem = async (req, res) => {
  try {
    const payload = await normalizeItemPayload(req.body, { isCreate: true });
    const item = await Inventory.create(payload);
    res.status(201).json({ success: true, item });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ success: false, message: 'Inventory code already exists. Try again.' });
    }
    res.status(400).json({ success: false, message: err.message });
  }
};

export const getAllItems = async (req, res) => {
  try {
    const { category, search, lowStock } = req.query;
    const query = { isActive: true };

    if (category && ALLOWED_CATEGORIES.includes(String(category).toLowerCase())) {
      query.category = String(category).toLowerCase();
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
      ];
    }

    if (lowStock === 'true') {
      query.$expr = { $lte: ['$currentStock', '$minStockAlert'] };
    }

    const items = await Inventory.find(query).sort({ category: 1, name: 1 });
    res.json({ success: true, items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getItem = async (req, res) => {
  try {
    const item = await Inventory.findOne({ _id: req.params.id, isActive: true });
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    res.json({ success: true, item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateItem = async (req, res) => {
  try {
    const item = await Inventory.findOne({ _id: req.params.id, isActive: true });
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

    const payload = await normalizeItemPayload(req.body);
    Object.assign(item, payload);
    await item.save();

    res.json({ success: true, item });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ success: false, message: 'Inventory code already exists. Try again.' });
    }
    res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteItem = async (req, res) => {
  try {
    const item = await Inventory.findOne({ _id: req.params.id, isActive: true });
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

    const transactionCount = await InventoryTransaction.countDocuments({ inventory: item._id });
    if (transactionCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete item with purchase history. Update the stock instead.',
      });
    }

    await item.deleteOne();
    res.json({ success: true, message: 'Inventory item deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const addTransaction = async (req, res) => {
  try {
    const inventoryId = req.body.inventoryId;
    const quantity = toNumber(req.body.quantity, NaN);
    const unitPrice = toNumber(req.body.unitPrice, NaN);
    const vendorName = String(req.body.vendorName || '').trim();

    if (!inventoryId) {
      return res.status(400).json({ success: false, message: 'Inventory item is required' });
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be greater than 0' });
    }
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      return res.status(400).json({ success: false, message: 'Buying price is required' });
    }
    if (!vendorName) {
      return res.status(400).json({ success: false, message: 'Vendor name is required' });
    }

    const item = await Inventory.findOne({ _id: inventoryId, isActive: true });
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

    item.currentStock = toNumber(item.currentStock, 0) + quantity;
    item.purchasePrice = unitPrice;
    if (!item.supplier) item.supplier = vendorName;
    await item.save();

    const transaction = await InventoryTransaction.create({
      inventory: inventoryId,
      type: 'bulk_purchase',
      quantity,
      unitPrice,
      totalAmount: quantity * unitPrice,
      vendorName,
      vendorPhone: String(req.body.vendorPhone || '').trim(),
      invoiceNo: String(req.body.invoiceNo || '').trim(),
      remarks: String(req.body.remarks || '').trim(),
      reference: String(req.body.reference || '').trim(),
      recordedBy: req.user.id,
    });

    const populatedTransaction = await InventoryTransaction.findById(transaction._id)
      .populate('inventory', 'name code unit category');

    res.status(201).json({ success: true, transaction: populatedTransaction, item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getTransactions = async (req, res) => {
  try {
    const { inventoryId, startDate, endDate, category } = req.query;
    const query = { type: 'bulk_purchase' };

    if (inventoryId) query.inventory = inventoryId;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    let transactions = await InventoryTransaction.find(query)
      .populate('inventory', 'name code unit category')
      .sort({ date: -1, createdAt: -1 });

    if (category && ALLOWED_CATEGORIES.includes(String(category).toLowerCase())) {
      transactions = transactions.filter(txn => txn.inventory?.category === String(category).toLowerCase());
    }

    res.json({ success: true, transactions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getInventoryStats = async (req, res) => {
  try {
    const stats = await Inventory.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalValue: { $sum: { $multiply: ['$currentStock', '$purchasePrice'] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const lowStockItems = await Inventory.find({
      isActive: true,
      $expr: { $lte: ['$currentStock', '$minStockAlert'] },
    }).select('name currentStock minStockAlert category code');

    res.json({ success: true, stats, lowStockItems });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
