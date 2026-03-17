import getRazorpay from '../config/razorpay.js';
import Payment from '../models/Payment.model.js';
import StudentFees from '../models/StudentFees.model.js';
import Ledger from '../models/Ledger.model.js';
import Student from '../models/Student.model.js';
import crypto from 'crypto';
import utils_pdfGenerator from '../utils/pdfGenerator.js';
const { generateReceipt } = utils_pdfGenerator;
import utils_notifications from '../utils/notifications.js';
const { sendSMS, sendEmail } = utils_notifications;

// @POST /api/payments/create-order
export const createOrder = async (req, res) => {
  try {
    const razorpay = getRazorpay();
    const { amount, studentFeesId, studentId } = req.body;
    const amountInPaise = Math.round(amount * 100);

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: 'rcpt_' + Date.now(),
      notes: { studentFeesId, studentId },
    });

    res.json({ success: true, order, key: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/payments/verify
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, studentFeesId, studentId, amount } = req.body;

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    await _recordPayment({
      studentId, studentFeesId, amount,
      paymentMode: 'online',
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      collectedBy: req.user?.id,
    });

    res.json({ success: true, message: 'Payment verified and recorded' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/payments/manual  (cash/cheque/dd)
export const manualPayment = async (req, res) => {
  try {
    const { studentId, studentFeesId, amount, paymentMode, description, isAdvance } = req.body;
    const payment = await _recordPayment({
      studentId, studentFeesId, amount, paymentMode,
      description, isAdvance, collectedBy: req.user.id,
    });
    res.status(201).json({ success: true, payment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Internal helper
async function _recordPayment({ studentId, studentFeesId, amount, paymentMode,
  razorpayOrderId, razorpayPaymentId, razorpaySignature, description, isAdvance, collectedBy }) {

  const student = await Student.findById(studentId).populate('course');
  const numericAmount = Number(amount);

  if (!numericAmount || numericAmount <= 0) {
    throw new Error('Enter a valid payment amount');
  }

  // Create payment record
  const payment = await Payment.create({
    student: studentId,
    studentFees: studentFeesId,
    amount: numericAmount,
    paymentMode,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    status: 'success',
    description: description || 'Fee Payment',
    isAdvance: isAdvance || false,
    collectedBy,
  });

  if (isAdvance) {
    // Update student advance amount
    await Student.findByIdAndUpdate(studentId, { $inc: { advanceAmount: numericAmount } });
    await Ledger.create({
      student: studentId,
      type: 'credit',
      category: 'advance',
      amount: numericAmount,
      description: 'Advance payment received',
      paymentRef: payment._id,
      date: new Date(),
      createdBy: collectedBy,
    });
  } else if (studentFeesId) {
    // Update student fees record
    const sf = await StudentFees.findById(studentFeesId);
    if (sf) {
      sf.totalPaid += numericAmount;
      let remainingAmount = numericAmount;
      sf.feeHeads = sf.feeHeads.map(h => {
        const due = h.amount - h.paid;
        if (due > 0 && remainingAmount > 0) {
          const pay = Math.min(due, remainingAmount);
          h.paid += pay;
          h.due = h.amount - h.paid;
          remainingAmount -= pay;
        }
        return h;
      });
      await sf.save();
    } else {
      throw new Error('Assigned fee record not found for this payment');
    }

    // Ledger credit entry
    await Ledger.create({
      student: studentId,
      type: 'credit',
      category: 'payment_received',
      amount: numericAmount,
      description: `Payment received via ${paymentMode}`,
      paymentRef: payment._id,
      feesRef: studentFeesId,
      date: new Date(),
      createdBy: collectedBy,
    });
  }

  // Notifications
  const msg = `Dear Student, Payment of ₹${numericAmount} received. Receipt: ${payment.receiptNo}. Thank you.`;
  if (student?.phone) await sendSMS(student.phone, msg);
  if (student?.father?.phone) await sendSMS(student.father.phone, msg);
  if (student?.email) await sendEmail(student.email, 'Payment Confirmation', msg);

  return payment;
}

// @GET /api/payments/student/:studentId
export const getStudentPayments = async (req, res) => {
  try {
    const { startDate, endDate, status, page = 1, limit = 20 } = req.query;
    const query = { student: req.params.studentId };
    if (status) query.status = status;
    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) query.paymentDate.$gte = new Date(startDate);
      if (endDate) query.paymentDate.$lte = new Date(endDate);
    }
    const total = await Payment.countDocuments(query);
    const payments = await Payment.find(query).sort('-paymentDate').skip((page - 1) * limit).limit(Number(limit));
    res.json({ success: true, payments, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/payments/receipt/:id
export const downloadReceipt = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate({ path: 'student', populate: { path: 'course', select: 'name' } });
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });

    const pdfBuffer = await generateReceipt(payment);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=receipt_${payment.receiptNo}.pdf`,
    });
    res.send(pdfBuffer);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/payments  (Admin - all payments)
export const getAllPayments = async (req, res) => {
  try {
    const { startDate, endDate, mode, status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (mode) query.paymentMode = mode;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) query.paymentDate.$gte = new Date(startDate);
      if (endDate) query.paymentDate.$lte = new Date(endDate);
    }
    const total = await Payment.countDocuments(query);
    const payments = await Payment.find(query)
      .populate('student', 'firstName lastName regNo phone')
      .sort('-paymentDate')
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ success: true, payments, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export default {
  createOrder,
  verifyPayment,
  manualPayment,
  getStudentPayments,
  downloadReceipt,
  getAllPayments,
};
