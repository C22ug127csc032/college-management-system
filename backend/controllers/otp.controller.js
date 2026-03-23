import User from '../models/User.model.js';
import Student from '../models/Student.model.js';
import jwt from 'jsonwebtoken';
import { sendSMS } from '../utils/notifications.js';
import { assertValidIndianPhone, normalizePhone } from '../utils/phone.js';

const generateToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '7d' });

const ensureStudentUserByPhone = async (phone) => {
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) return null;

  let user = await User.findOne({ phone: normalizedPhone }).populate('studentRef');
  if (user) return user;

  const student = await Student.findOne({ phone: normalizedPhone });
  if (!student) return null;

  user = await User.create({
    name: `${student.firstName} ${student.lastName}`.trim(),
    phone: student.phone,
    email: student.email || undefined,
    password: student.phone,
    role: 'student',
    studentRef: student._id,
  });

  if (!student.userRef) {
    student.userRef = user._id;
    await student.save();
  }

  return User.findById(user._id).populate('studentRef');
};

// POST /api/auth/send-otp
export const sendOTP = async (req, res) => {
  try {
    const normalizedPhone = assertValidIndianPhone(req.body.phone);
    const user = await ensureStudentUserByPhone(normalizedPhone) || await User.findOne({ phone: normalizedPhone });
    if (!user) return res.status(404).json({ success: false, message: 'Phone number not registered' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpire = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendSMS(normalizedPhone, `Your OTP is: ${otp}. Valid for 10 minutes. Do not share.`);
    res.json({ success: true, message: 'OTP sent to ' + normalizedPhone });
  } catch (err) {
    const status = /phone number/i.test(err.message) ? 400 : 500;
    res.status(status).json({ success: false, message: err.message });
  }
};

// POST /api/auth/verify-otp
export const verifyOTP = async (req, res) => {
  try {
    const { otp } = req.body;
    const normalizedPhone = assertValidIndianPhone(req.body.phone);
    const user = await ensureStudentUserByPhone(normalizedPhone) || await User.findOne({ phone: normalizedPhone }).populate('studentRef');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.otp !== otp) return res.status(400).json({ success: false, message: 'Invalid OTP' });
    if (!user.otpExpire || user.otpExpire < new Date())
      return res.status(400).json({ success: false, message: 'OTP expired. Request a new one.' });

    user.otp = undefined;
    user.otpExpire = undefined;
    await user.save();

    res.json({
      success: true,
      token: generateToken(user._id, user.role),
      user: {
        _id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        studentRef: user.studentRef,
      },
    });
  } catch (err) {
    const status = /phone number/i.test(err.message) ? 400 : 500;
    res.status(status).json({ success: false, message: err.message });
  }
};
