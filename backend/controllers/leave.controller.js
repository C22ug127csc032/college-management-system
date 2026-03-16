import Leave from '../models/Leave.model.js';
import Student from '../models/Student.model.js';
import utils_notifications from '../utils/notifications.js';
const { sendSMS, sendEmail } = utils_notifications;

export const applyLeave = async (req, res) => {
  try {
    const { studentId, leaveType, fromDate, toDate, reason } = req.body;
    const leave = await Leave.create({
      student: studentId,
      appliedBy: req.user.id,
      appliedByRole: req.user.role === 'student' ? 'student' : 'parent',
      leaveType, fromDate, toDate, reason,
    });
    const student = await Student.findById(studentId);
    if (student?.phone)
      await sendSMS(student.phone, `Leave application submitted for ${fromDate} to ${toDate}. Status: Pending.`);
    res.status(201).json({ success: true, leave });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getLeaves = async (req, res) => {
  try {
    const { studentId, status, startDate, endDate, page = 1, limit = 20 } = req.query;
    const query = {};
    if (studentId) query.student = studentId;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.fromDate = {};
      if (startDate) query.fromDate.$gte = new Date(startDate);
      if (endDate) query.fromDate.$lte = new Date(endDate);
    }
    // If student role - only their own
    if (req.user.role === 'student') {
      const student = await Student.findOne({ userRef: req.user.id });
      if (student) query.student = student._id;
    }
    const total = await Leave.countDocuments(query);
    const leaves = await Leave.find(query)
      .populate('student', 'firstName lastName regNo phone')
      .populate('approvedBy', 'name role')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ success: true, leaves, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateLeaveStatus = async (req, res) => {
  try {
    const { status, remarks } = req.body;
    const leave = await Leave.findByIdAndUpdate(req.params.id, {
      status, remarks, approvedBy: req.user.id, approvedAt: new Date()
    }, { new: true }).populate('student', 'firstName lastName phone father');
    if (!leave) return res.status(404).json({ success: false, message: 'Leave not found' });

    const student = leave.student;
    const msg = `Leave request ${status}. ${remarks ? 'Remarks: ' + remarks : ''}`;
    if (student?.phone) await sendSMS(student.phone, msg);
    if (student?.father?.phone) await sendSMS(student.father.phone, msg);
    res.json({ success: true, leave });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id)
      .populate('student', 'firstName lastName regNo phone')
      .populate('approvedBy', 'name');
    if (!leave) return res.status(404).json({ success: false, message: 'Leave not found' });
    res.json({ success: true, leave });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export default {
  applyLeave,
  getLeaves,
  updateLeaveStatus,
  getLeave,
};
