import express from 'express';
const r = express.Router();
import Ledger from '../models/Ledger.model.js';
import { classTeacherHasStudentAccess } from '../utils/staffCourseScope.js';
import middleware_auth_middleware from '../middleware/auth.middleware.js';
const { protect } = middleware_auth_middleware;

r.get('/student/:studentId', protect, async (req, res) => {
  try {
    if (req.user?.role === 'class_teacher') {
      const hasAccess = await classTeacherHasStudentAccess(req.user, req.params.studentId);
      if (!hasAccess) {
        return res.status(404).json({ success: false, message: 'Student not found' });
      }
    }

    const entries = await Ledger.find({ student: req.params.studentId })
      .populate('paymentRef', 'receiptNo paymentDate paymentMode')
      .sort('-date');
    // Compute running balance
    let balance = 0;
    const withBalance = entries.reverse().map(e => {
      if (e.type === 'debit') balance += e.amount;
      else balance -= e.amount;
      return { ...e.toObject(), runningBalance: balance };
    }).reverse();
    res.json({ success: true, entries: withBalance });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default r;
