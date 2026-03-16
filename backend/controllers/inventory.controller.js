const { Inventory, InventoryTransaction } = require('../models/Inventory.model');

exports.createItem = async (req, res) => {
  try {
    const item = await Inventory.create(req.body);
    res.status(201).json({ success: true, item });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getAllItems = async (req, res) => {
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

exports.getItem = async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    res.json({ success: true, item });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.updateItem = async (req, res) => {
  try {
    const item = await Inventory.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, item });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.addTransaction = async (req, res) => {
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

exports.getTransactions = async (req, res) => {
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

exports.getInventoryStats = async (req, res) => {
  try {
    const stats = await Inventory.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 }, totalValue: { $sum: { $multiply: ['$currentStock', '$purchasePrice'] } } } }
    ]);
    const lowStockItems = await Inventory.find({ $expr: { $lte: ['$currentStock', '$minStockAlert'] } }).select('name currentStock minStockAlert category');
    res.json({ success: true, stats, lowStockItems });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
