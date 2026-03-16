import express from 'express';
import * as c from '../controllers/parent.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import Leave from '../models/Leave.model.js';
import Outpass from '../models/Outpass.model.js';
import StudentFees from '../models/StudentFees.model.js';
import Circular from '../models/Circular.model.js';
import Payment from '../models/Payment.model.js';

const router = express.Router();

// Public routes
router.post('/register',   c.register);
router.post('/send-otp',   c.sendOTP);
router.post('/verify-otp', c.verifyOTP);

// Protected â€” parent only
router.use(protect);
router.use(authorize('parent'));

router.get('/dashboard', c.getDashboard);
router.get('/student',   c.getStudent);

// Leave
router.post('/leave', async (req, res) => {
  try {
    const { leaveType, fromDate, toDate, reason } = req.body;
    const leave = await Leave.create({
      student: req.user.studentRef,
      appliedBy: req.user.id,
      appliedByRole: 'parent',
      leaveType, fromDate, toDate, reason,
    });
    res.status(201).json({ success: true, leave });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/leave', async (req, res) => {
  try {
    const leaves = await Leave.find({ student: req.user.studentRef })
      .populate('approvedBy', 'name').sort('-createdAt');
    res.json({ success: true, leaves });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Outpass
router.post('/outpass', async (req, res) => {
  try {
    const { exitDate, exitTime, expectedReturn, reason, destination } = req.body;
    const outpass = await Outpass.create({
      student: req.user.studentRef,
      requestedBy: req.user.id,
      exitDate, exitTime, expectedReturn, reason, destination,
    });
    res.status(201).json({ success: true, outpass });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/outpass', async (req, res) => {
  try {
    const outpasses = await Outpass.find({ student: req.user.studentRef })
      .populate('approvedBy', 'name').sort('-createdAt');
    res.json({ success: true, outpasses });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Fees
router.get('/fees', async (req, res) => {
  try {
    const fees = await StudentFees.find({ student: req.user.studentRef })
      .populate('structure', 'name feeHeads').sort('-createdAt');
    res.json({ success: true, fees });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Payments
router.get('/payments', async (req, res) => {
  try {
    const payments = await Payment.find({ student: req.user.studentRef, status: 'success' })
      .sort('-paymentDate');
    res.json({ success: true, payments });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Circulars
router.get('/circulars', async (req, res) => {
  try {
    const circulars = await Circular.find({
      isPublished: true,
      audience: { $in: ['parents', 'all'] },
    }).sort('-publishDate').limit(30);
    res.json({ success: true, circulars });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

export default router;
