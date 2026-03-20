import express from 'express';
import {
  requestRegisterOTP,
  verifyRegisterOTP,
  register,
  sendOTP,
  verifyOTP,
  getDashboard,
  getStudent,
} from '../controllers/parent.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import Leave      from '../models/Leave.model.js';
import Outpass    from '../models/Outpass.model.js';
import StudentFees from '../models/StudentFees.model.js';
import Circular   from '../models/Circular.model.js';
import Payment    from '../models/Payment.model.js';
import User       from '../models/User.model.js';
import Student    from '../models/Student.model.js';
import {
  createNotifications,
  getCourseTeacherRecipientIds,
  getRoleRecipientIds,
  getStudentNotificationRecipientIds,
} from '../utils/appNotifications.js';

const router = express.Router();

// ── Public routes — no auth needed ───────────────────────────────────────────
router.post('/request-register-otp', requestRegisterOTP);
router.post('/verify-register-otp',  verifyRegisterOTP);
router.post('/register',             register);
router.post('/send-otp',             sendOTP);
router.post('/verify-otp',           verifyOTP);

// ── Protected — parent only ───────────────────────────────────────────────────
router.use(protect);
router.use(authorize('parent'));

router.get('/dashboard', getDashboard);
router.get('/student',   getStudent);

// Leave
router.post('/leave', async (req, res) => {
  try {
    const fullUser = await User.findById(req.user._id);
    const { leaveType, fromDate, toDate, reason } = req.body;
    const leave = await Leave.create({
      student:       fullUser.studentRef,
      appliedBy:     req.user._id,
      appliedByRole: 'parent',
      leaveType, fromDate, toDate, reason,
    });
    const student = await Student.findById(fullUser.studentRef).select('firstName course userRef');
    const teacherRecipients = student?.course
      ? await getCourseTeacherRecipientIds(student.course)
      : [];
    const adminRecipients = await getRoleRecipientIds(['super_admin']);

    await createNotifications({
      recipientIds: [...teacherRecipients, ...adminRecipients],
      student: student?._id,
      type: 'leave_status',
      title: 'New leave request',
      message: `${student?.firstName || 'A student'} requested leave from ${fromDate} to ${toDate}.`,
      reference: String(leave._id),
    });

    await createNotifications({
      recipientIds: await getStudentNotificationRecipientIds(student),
      student: student?._id,
      type: 'leave_status',
      title: 'Leave request submitted',
      message: `Your leave request from ${fromDate} to ${toDate} is pending approval.`,
      reference: String(leave._id),
    });
    res.status(201).json({ success: true, leave });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/leave', async (req, res) => {
  try {
    const fullUser = await User.findById(req.user._id);
    const leaves = await Leave.find({ student: fullUser.studentRef })
      .populate('approvedBy', 'name').sort('-createdAt');
    res.json({ success: true, leaves });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Outpass
router.post('/outpass', async (req, res) => {
  try {
    const fullUser = await User.findById(req.user._id);
    const { exitDate, exitTime, expectedReturn, reason, destination } = req.body;
    const outpass = await Outpass.create({
      student:      fullUser.studentRef,
      requestedBy:  req.user._id,
      exitDate, exitTime, expectedReturn, reason, destination,
    });
    const student = await Student.findById(fullUser.studentRef).select('firstName course userRef');
    const teacherRecipients = student?.course
      ? await getCourseTeacherRecipientIds(student.course)
      : [];
    const staffRecipients = await getRoleRecipientIds(['super_admin', 'hostel_warden']);

    await createNotifications({
      recipientIds: [...teacherRecipients, ...staffRecipients],
      student: student?._id,
      type: 'outpass_status',
      title: 'New outpass request',
      message: `${student?.firstName || 'A student'} requested outpass for ${destination || 'outside visit'}.`,
      reference: String(outpass._id),
    });

    await createNotifications({
      recipientIds: await getStudentNotificationRecipientIds(student),
      student: student?._id,
      type: 'outpass_status',
      title: 'Outpass request submitted',
      message: `Your outpass request for ${exitDate} is pending approval.`,
      reference: String(outpass._id),
    });
    res.status(201).json({ success: true, outpass });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/outpass', async (req, res) => {
  try {
    const fullUser = await User.findById(req.user._id);
    const outpasses = await Outpass.find({ student: fullUser.studentRef })
      .populate('approvedBy', 'name').sort('-createdAt');
    res.json({ success: true, outpasses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Fees
router.get('/fees', async (req, res) => {
  try {
    const fullUser = await User.findById(req.user._id);
    const fees = await StudentFees.find({ student: fullUser.studentRef })
      .populate('structure', 'name feeHeads').sort('-createdAt');
    res.json({ success: true, fees });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Payments
router.get('/payments', async (req, res) => {
  try {
    const fullUser = await User.findById(req.user._id);
    const payments = await Payment.find({
      student: fullUser.studentRef,
      status:  'success',
    }).sort('-paymentDate');
    res.json({ success: true, payments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Circulars
router.get('/circulars', async (req, res) => {
  try {
    const circulars = await Circular.find({
      isPublished: true,
      $or: [
        { audience: 'all' },
        { audience: 'parents' },
        { audience: { $in: ['all', 'parents'] } },
      ],
    }).sort('-publishDate').limit(30);
    res.json({ success: true, circulars });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
