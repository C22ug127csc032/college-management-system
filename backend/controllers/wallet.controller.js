import Wallet from '../models/Wallet.model.js';
import razorpay from '../config/razorpay.js';
import crypto from 'crypto';

// GET /api/wallet/:studentId
export const getWallet = async (req, res) => {
  try {
    let wallet = await Wallet.findOne({ student: req.params.studentId });
    if (!wallet) wallet = await Wallet.create({ student: req.params.studentId });
    res.json({ success: true, wallet });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// POST /api/wallet/topup/order
export const createTopupOrder = async (req, res) => {
  try {
    const { studentId, amount } = req.body;
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: 'wallet_' + Date.now(),
      notes: { studentId, type: 'wallet_topup' },
    });
    res.json({ success: true, order, key: process.env.RAZORPAY_KEY_ID });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// POST /api/wallet/topup/verify
export const verifyTopup = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, studentId, amount } = req.body;

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body).digest('hex');

    if (expected !== razorpay_signature)
      return res.status(400).json({ success: false, message: 'Verification failed' });

    let wallet = await Wallet.findOne({ student: studentId });
    if (!wallet) wallet = await Wallet.create({ student: studentId });

    wallet.balance += Number(amount);
    wallet.transactions.push({
      type: 'credit', amount,
      description: 'Wallet top-up via Razorpay',
      reference: razorpay_payment_id,
    });
    await wallet.save();
    res.json({ success: true, wallet, message: `â‚¹${amount} credited to wallet` });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// POST /api/wallet/topup/manual  (admin)
export const manualTopup = async (req, res) => {
  try {
    const { studentId, amount, description } = req.body;
    let wallet = await Wallet.findOne({ student: studentId });
    if (!wallet) wallet = await Wallet.create({ student: studentId });
    wallet.balance += Number(amount);
    wallet.transactions.push({
      type: 'credit', amount,
      description: description || 'Manual top-up by admin',
    });
    await wallet.save();
    res.json({ success: true, wallet });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// Internal helper used by shop/canteen controller
export const deductWallet = async (studentId, amount, description) => {
  const wallet = await Wallet.findOne({ student: studentId });
  if (!wallet || wallet.balance < amount) throw new Error('Insufficient wallet balance');
  wallet.balance -= amount;
  wallet.transactions.push({ type: 'debit', amount, description });
  await wallet.save();
  return wallet;
};
