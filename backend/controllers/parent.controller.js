import User from '../models/User.model.js';
import Student from '../models/Student.model.js';
import Leave from '../models/Leave.model.js';
import Outpass from '../models/Outpass.model.js';
import StudentFees from '../models/StudentFees.model.js';
import Circular from '../models/Circular.model.js';
import CheckIn from '../models/CheckIn.model.js';
import Payment from '../models/Payment.model.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { sendSMS } from '../utils/notifications.js';

const generateToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '7d' });

// POST /api/parent/register
export const register = async (req, res) => {
  try {
    const { name, phone, email, password, studentRegNo, relation } = req.body;

    const student = await Student.findOne({ regNo: studentRegNo });
    if (!student)
      return res.status(404).json({ success: false, message: 'Student not found with this Reg No' });

    const existing = await User.findOne({ phone });
    if (existing)
      return res.status(400).json({ success: false, message: 'Phone already registered' });

    const user = await User.create({
      name, phone, email, password,
      role: 'parent',
      studentRef: student._id,
    });

    res.status(201).json({
      success: true,
      message: 'Parent registered successfully',
      token: generateToken(user._id, 'parent'),
      user: { _id: user._id, name: user.name, phone: user.phone, role: 'parent', studentRef: student._id },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/parent/send-otp
export const sendOTP = async (req, res) => {
  try {
    const { phone } = req.body;
    const user = await User.findOne({ phone, role: 'parent' });
    if (!user) return res.status(404).json({ success: false, message: 'Parent not found' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpire = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendSMS(phone, `Your College Portal OTP is: ${otp}. Valid for 10 minutes.`);
    res.json({ success: true, message: 'OTP sent' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/parent/verify-otp
export const verifyOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    const user = await User.findOne({ phone, role: 'parent' }).populate('studentRef');
    if (!user) return res.status(404).json({ success: false, message: 'Parent not found' });
    if (user.otp !== otp) return res.status(400).json({ success: false, message: 'Invalid OTP' });
    if (user.otpExpire < new Date()) return res.status(400).json({ success: false, message: 'OTP expired' });

    user.otp = undefined;
    user.otpExpire = undefined;
    await user.save();

    res.json({
      success: true,
      token: generateToken(user._id, 'parent'),
      user: { _id: user._id, name: user.name, phone: user.phone, role: 'parent', studentRef: user.studentRef },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/parent/dashboard
export const getDashboard = async (req, res) => {
  try {
    const studentId = req.user.studentRef;
    if (!studentId)
      return res.status(404).json({ success: false, message: 'No student linked' });

    const [student, fees, leaves, outpasses, checkins, circulars, recentPayments] = await Promise.all([
      Student.findById(studentId).populate('course', 'name'),
      StudentFees.find({ student: studentId }).sort('-createdAt').limit(5),
      Leave.find({ student: studentId }).sort('-createdAt').limit(5),
      Outpass.find({ student: studentId }).sort('-createdAt').limit(3),
      CheckIn.find({ student: studentId }).sort('-timestamp').limit(5),
      Circular.find({ isPublished: true, audience: { $in: ['parents', 'all'] } }).sort('-publishDate').limit(5),
      Payment.find({ student: studentId, status: 'success' }).sort('-paymentDate').limit(5),
    ]);

    const totalDue = fees.reduce((s, f) => s + (f.totalDue || 0), 0);
    const pendingLeaves = leaves.filter(l => l.status === 'pending').length;

    res.json({
      success: true, student,
      summary: { totalDue, pendingLeaves, totalFees: fees.length },
      fees, leaves, outpasses, checkins, circulars, recentPayments,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/parent/student
export const getStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.user.studentRef)
      .populate('course', 'name code department');
    res.json({ success: true, student });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
