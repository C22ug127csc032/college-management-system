import Wallet  from '../models/Wallet.model.js';
import Student from '../models/Student.model.js';
import crypto  from 'crypto';

// ── GET /api/wallet/:studentId ────────────────────────────────────────────────
export const getWallet = async (req, res) => {
  try {
    let wallet = await Wallet.findOne({ student: req.params.studentId });
    if (!wallet) wallet = await Wallet.create({ student: req.params.studentId });
    res.json({ success: true, wallet });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/wallet/find/:identifier ─────────────────────────────────────────
// Find student wallet by phone OR admissionNo — used by canteen/shop operator
export const findStudentWallet = async (req, res) => {
  try {
    const { identifier } = req.params;

    // Search by phone or admissionNo
    const student = await Student.findOne({
      $or: [
        { phone:       identifier.trim() },
        { admissionNo: identifier.trim().toUpperCase() },
      ],
    }).populate('course', 'name');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: `No student found with phone or admission no: ${identifier}`,
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
        admissionNo: student.admissionNo,
        phone:       student.phone,
        course:      student.course?.name,
        photo:       student.photo,
      },
      wallet,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/wallet/topup/order — Parent initiates Razorpay order ────────────
export const createTopupOrder = async (req, res) => {
  try {
    const { studentId, amount } = req.body;
    const numericAmount = Number(amount);

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'Student ID is required',
      });
    }

    if (!numericAmount || numericAmount < 10) {
      return res.status(400).json({
        success: false,
        message: 'Minimum top-up is ₹10',
      });
    }

    // Try Razorpay — if not configured use manual mock
    try {
      const getRazorpay = (await import('../config/razorpay.js')).default;
      const razorpay    = getRazorpay();
      const order       = await razorpay.orders.create({
        amount:   Math.round(numericAmount * 100),
        currency: 'INR',
        receipt:  'wallet_' + Date.now(),
        notes:    { studentId, type: 'wallet_topup' },
      });
      return res.json({
        success: true,
        order,
        key: process.env.RAZORPAY_KEY_ID,
      });
    } catch {
      // Razorpay not configured — return mock order for testing
      return res.json({
        success:   true,
        mockOrder: true,
        order: {
          id:       'mock_order_' + Date.now(),
          amount:   numericAmount * 100,
          currency: 'INR',
        },
        key: 'mock_key',
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/wallet/topup/verify — Razorpay payment verification ─────────────
export const verifyTopup = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      studentId,
      amount,
    } = req.body;

    // Verify signature
    const body     = razorpay_order_id + '|' + razorpay_payment_id;
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'mock')
      .update(body)
      .digest('hex');

    if (expected !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed',
      });
    }

    let wallet = await Wallet.findOne({ student: studentId });
    if (!wallet) wallet = await Wallet.create({ student: studentId });

    wallet.balance += Number(amount);
    wallet.transactions.push({
      type:        'credit',
      amount:      Number(amount),
      description: 'Wallet top-up via Razorpay',
      reference:   razorpay_payment_id,
      date:        new Date(),
    });
    await wallet.save();

    res.json({
      success: true,
      wallet,
      message: `₹${amount} added to wallet successfully`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/wallet/topup/manual — Parent manual top-up (no Razorpay) ────────
// Used when Razorpay is not configured — direct credit
export const manualTopup = async (req, res) => {
  try {
    const { studentId, amount, description } = req.body;

    if (!studentId || !amount || Number(amount) < 1) {
      return res.status(400).json({
        success: false,
        message: 'Student ID and amount are required. Minimum ₹1.',
      });
    }

    let wallet = await Wallet.findOne({ student: studentId });
    if (!wallet) wallet = await Wallet.create({ student: studentId });

    wallet.balance += Number(amount);
    wallet.transactions.push({
      type:        'credit',
      amount:      Number(amount),
      description: description || 'Wallet top-up by parent',
      date:        new Date(),
    });
    await wallet.save();

    res.json({
      success: true,
      wallet,
      message: `₹${amount} added to wallet`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/wallet/deduct/canteen — Canteen operator deducts ────────────────
export const canteenDeduct = async (req, res) => {
  try {
    const { studentId, amount, description, items } = req.body;

    if (!studentId || !amount || Number(amount) < 1) {
      return res.status(400).json({
        success: false,
        message: 'Student ID and amount are required',
      });
    }

    const wallet = await Wallet.findOne({ student: studentId });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found for this student',
      });
    }

    if (wallet.balance < Number(amount)) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Available: ₹${wallet.balance}`,
        balance: wallet.balance,
      });
    }

    wallet.balance -= Number(amount);
    wallet.transactions.push({
      type:        'debit',
      amount:      Number(amount),
      description: description || 'Canteen purchase',
      items:       items || [],
      date:        new Date(),
    });
    await wallet.save();

    res.json({
      success:   true,
      wallet,
      message:   `₹${amount} deducted for canteen purchase`,
      balance:   wallet.balance,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/wallet/deduct/shop — Shop operator deducts ─────────────────────
export const shopDeduct = async (req, res) => {
  try {
    const { studentId, amount, description, items } = req.body;

    if (!studentId || !amount || Number(amount) < 1) {
      return res.status(400).json({
        success: false,
        message: 'Student ID and amount are required',
      });
    }

    const wallet = await Wallet.findOne({ student: studentId });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found for this student',
      });
    }

    if (wallet.balance < Number(amount)) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Available: ₹${wallet.balance}`,
        balance: wallet.balance,
      });
    }

    wallet.balance -= Number(amount);
    wallet.transactions.push({
      type:        'debit',
      amount:      Number(amount),
      description: description || 'Shop purchase',
      items:       items || [],
      date:        new Date(),
    });
    await wallet.save();

    res.json({
      success: true,
      wallet,
      message: `₹${amount} deducted for shop purchase`,
      balance: wallet.balance,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Internal helper — used by other controllers ────────────────────────────────
export const deductWallet = async (studentId, amount, description) => {
  const wallet = await Wallet.findOne({ student: studentId });
  if (!wallet || wallet.balance < amount) {
    throw new Error('Insufficient wallet balance');
  }
  wallet.balance -= amount;
  wallet.transactions.push({
    type: 'debit',
    amount,
    description,
    date: new Date(),
  });
  await wallet.save();
  return wallet;
};