import ShopItem from '../models/ShopItem.model.js';
import Sale     from '../models/Sale.model.js';
import Wallet   from '../models/Wallet.model.js';
import Student  from '../models/Student.model.js';
import { buildStudentIdentifierQuery, getPreferredStudentIdentifier } from '../utils/studentIdentity.js';

const buildItemCodePrefix = type => (type === 'canteen' ? 'CAN' : 'SHP');

const generateItemCode = async type => {
  const prefix = buildItemCodePrefix(type);

  for (let serial = 1; serial < 100000; serial += 1) {
    const code = `${prefix}${String(serial).padStart(4, '0')}`;
    const exists = await ShopItem.exists({ code });
    if (!exists) return code;
  }

  throw new Error('Unable to generate item code');
};

// ── GET /api/shop/items?type=shop|canteen ─────────────────────────────────────
export const getItems = async (req, res) => {
  try {
    const { type } = req.query;
    const query = {};
    if (type) query.type = type;

    const items = await ShopItem.find(query)
      .populate('createdBy', 'name')
      .sort('name');

    res.json({ success: true, items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/shop/items — Operator adds item ─────────────────────────────────
export const addItem = async (req, res) => {
  try {
    const {
      name, code, price, unit, stock,
      minStockAlert, type, isAvailable,
    } = req.body;

    // Determine type from operator role if not provided
    let itemType = type;
    if (!itemType) {
      itemType = req.user.role === 'canteen_operator' ? 'canteen' : 'shop';
    }

    const normalizedCode = String(code || '').trim().toUpperCase();
    const nextCode = normalizedCode || await generateItemCode(itemType);

    if (await ShopItem.exists({ code: nextCode })) {
      return res.status(400).json({
        success: false,
        message: 'Item code already exists',
      });
    }

    const item = await ShopItem.create({
      name,
      code:          nextCode,
      price,
      unit,
      stock,
      minStockAlert: minStockAlert || 5,
      type:          itemType,
      isAvailable:   isAvailable !== false,
      createdBy:     req.user._id,
    });

    res.status(201).json({ success: true, item });
  } catch (err) {
    const status = err.code === 11000 ? 400 : 500;
    res.status(status).json({ success: false, message: err.message });
  }
};

// ── PUT /api/shop/items/:id — Operator edits item ─────────────────────────────
export const updateItem = async (req, res) => {
  try {
    const item = await ShopItem.findByIdAndUpdate(
      req.params.id, req.body, { new: true }
    );
    if (!item) {
      return res.status(404).json({
        success: false, message: 'Item not found',
      });
    }
    res.json({ success: true, item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE /api/shop/items/:id ────────────────────────────────────────────────
export const deleteItem = async (req, res) => {
  try {
    await ShopItem.findByIdAndUpdate(req.params.id, { isAvailable: false });
    res.json({ success: true, message: 'Item removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/shop/items/:id/stock — Add/remove stock ────────────────────────
export const updateStock = async (req, res) => {
  try {
    const { quantity, action } = req.body;
    const item = await ShopItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false, message: 'Item not found',
      });
    }

    if (action === 'add') {
      item.stock += Number(quantity);
    } else if (action === 'remove') {
      item.stock = Math.max(0, item.stock - Number(quantity));
    } else {
      item.stock = Number(quantity);
    }

    await item.save();
    res.json({ success: true, item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/shop/find/:identifier — Find student ────────────────────────────
export const findStudent = async (req, res) => {
  try {
    const { identifier } = req.params;
    const identifierQuery = buildStudentIdentifierQuery(identifier);
    const student = await Student.findOne({
      $or: [
        { phone:       identifier.trim() },
        ...identifierQuery.$or,
      ],
    }).populate('course', 'name');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: `No student found with: ${identifier}`,
      });
    }

    let wallet = await Wallet.findOne({ student: student._id });
    if (!wallet) wallet = await Wallet.create({ student: student._id });

    res.json({
      success: true,
      student: {
        _id:         student._id,
        firstName:   student.firstName,
        lastName:    student.lastName,
        rollNo:      student.rollNo,
        admissionNo: student.admissionNo,
        studentIdentifier: getPreferredStudentIdentifier(student),
        phone:       student.phone,
        course:      student.course?.name,
        photo:       student.photo,
      },
      wallet: {
        balance:      wallet.balance,
        transactions: wallet.transactions.slice(-5),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/shop/sell — Create sale bill ────────────────────────────────────
export const createSale = async (req, res) => {
  try {
    const {
      studentId,
      items,       // [{ itemId, qty }]
      paymentMode, // 'wallet' | 'cash'
      type,        // 'shop' | 'canteen'
    } = req.body;

    if (!studentId || !items || !items.length) {
      return res.status(400).json({
        success: false,
        message: 'Student and items are required',
      });
    }

    // Fetch all items from DB
    const itemIds    = items.map(i => i.itemId);
    const dbItems    = await ShopItem.find({ _id: { $in: itemIds } });

    if (!dbItems.length) {
      return res.status(404).json({
        success: false, message: 'Items not found',
      });
    }

    // Build bill items and calculate total
    const billItems  = [];
    let   totalAmount = 0;

    for (const ordered of items) {
      const dbItem = dbItems.find(
        d => d._id.toString() === ordered.itemId
      );
      if (!dbItem) continue;

      if (dbItem.stock < ordered.qty) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${dbItem.name}. Available: ${dbItem.stock}`,
        });
      }

      const lineTotal = dbItem.price * ordered.qty;
      totalAmount += lineTotal;

      billItems.push({
        item:      dbItem._id,
        name:      dbItem.name,
        qty:       ordered.qty,
        unitPrice: dbItem.price,
        total:     lineTotal,
      });
    }

    // ── Wallet payment — check balance ────────────────────────────────────
    if (paymentMode === 'wallet') {
      const wallet = await Wallet.findOne({ student: studentId });
      if (!wallet || wallet.balance < totalAmount) {
        return res.status(400).json({
          success: false,
          message: `Insufficient wallet balance. Available: ₹${wallet?.balance || 0}. Required: ₹${totalAmount}`,
          balance: wallet?.balance || 0,
        });
      }

      // Deduct from wallet
      wallet.balance -= totalAmount;
      wallet.transactions.push({
        type:        'debit',
        amount:      totalAmount,
        description: `${type === 'canteen' ? 'Canteen' : 'Shop'} purchase`,
        date:        new Date(),
      });
      await wallet.save();
    }

    // ── Deduct stock for all items ────────────────────────────────────────
    for (const ordered of items) {
      await ShopItem.findByIdAndUpdate(ordered.itemId, {
        $inc: { stock: -ordered.qty },
      });
    }

    // ── Create sale record ────────────────────────────────────────────────
    const sale = await Sale.create({
      student:     studentId,
      operator:    req.user._id,
      type:        type || (req.user.role === 'canteen_operator' ? 'canteen' : 'shop'),
      items:       billItems,
      totalAmount,
      paymentMode,
      date:        new Date(),
    });

    await sale.populate('student', 'firstName lastName rollNo admissionNo');

    // Get updated wallet balance
    const updatedWallet = await Wallet.findOne({ student: studentId });

    res.status(201).json({
      success:     true,
      sale,
      message:     `Bill ${sale.billNo} created. ₹${totalAmount} charged via ${paymentMode}`,
      walletBalance: updatedWallet?.balance || 0,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/shop/sales — Sales list ─────────────────────────────────────────
export const getSales = async (req, res) => {
  try {
    const {
      type, date, studentId,
      page = 1, limit = 20,
    } = req.query;

    const query = {};
    if (type)      query.type    = type;
    if (studentId) query.student = studentId;

    // Filter by date — today by default for operators
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    }

    const total = await Sale.countDocuments(query);
    const sales = await Sale.find(query)
      .populate('student', 'firstName lastName rollNo admissionNo phone')
      .populate('operator', 'name')
      .sort('-date')
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Calculate totals
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todaySales = await Sale.aggregate([
      {
        $match: {
          ...(type ? { type } : {}),
          date: { $gte: todayStart, $lte: todayEnd },
        },
      },
      {
        $group: {
          _id:           null,
          totalRevenue:  { $sum: '$totalAmount' },
          walletRevenue: {
            $sum: {
              $cond: [{ $eq: ['$paymentMode', 'wallet'] }, '$totalAmount', 0],
            },
          },
          cashRevenue: {
            $sum: {
              $cond: [{ $eq: ['$paymentMode', 'cash'] }, '$totalAmount', 0],
            },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      sales,
      total,
      pages: Math.ceil(total / limit),
      todaySummary: todaySales[0] || {
        totalRevenue: 0, walletRevenue: 0,
        cashRevenue: 0, count: 0,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
