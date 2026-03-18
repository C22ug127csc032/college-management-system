import User       from '../models/User.model.js';
import Student    from '../models/Student.model.js';
import Leave      from '../models/Leave.model.js';
import Outpass    from '../models/Outpass.model.js';
import StudentFees from '../models/StudentFees.model.js';
import Circular   from '../models/Circular.model.js';
import CheckIn    from '../models/CheckIn.model.js';
import Payment    from '../models/Payment.model.js';
import jwt        from 'jsonwebtoken';
import { sendSMS } from '../utils/notifications.js';

const generateToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '7d' });

// ── STEP 1 — POST /api/parent/request-register-otp ───────────────────────────
// Parent enters Admission No → OTP sent to father/mother phone in student record
export const requestRegisterOTP = async (req, res) => {
  try {
    const { admissionNo } = req.body;

    if (!admissionNo) {
      return res.status(400).json({
        success: false,
        message: 'Admission No is required',
      });
    }

    // Find student by admission no
    const student = await Student.findOne({
      admissionNo: admissionNo.trim().toUpperCase(),
    }).populate('course', 'name');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: `No student found with Admission No: ${admissionNo}`,
      });
    }

    // Get parent phone from student record
    const parentPhone = student.father?.phone || student.mother?.phone;

    if (!parentPhone) {
      return res.status(400).json({
        success: false,
        message: 'No parent phone number found in student record. Contact admin to add parent phone first.',
      });
    }

    // Generate OTP
    const otp       = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpire = new Date(Date.now() + 10 * 60 * 1000);

    // Save OTP in student record temporarily
    student.parentRegOTP       = otp;
    student.parentRegOTPExpire = otpExpire;
    await student.save();

    // Send OTP to parent phone
    await sendSMS(
      parentPhone,
      `Your OTP to register as parent for ${student.firstName} ${student.lastName} is: ${otp}. Valid for 10 minutes. Do not share.`
    );

    // Mask phone — show only last 4 digits
    const masked = parentPhone.replace(/.(?=.{4})/g, '*');

    res.json({
      success:     true,
      message:     `OTP sent to ${masked}`,
      maskedPhone: masked,
      studentName: `${student.firstName} ${student.lastName}`,
      admissionNo: student.admissionNo,
      course:      student.course?.name,
    });
  } catch (err) {
    console.error('requestRegisterOTP error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── STEP 2 — POST /api/parent/verify-register-otp ────────────────────────────
// Verify OTP → allow parent to proceed to create account
export const verifyRegisterOTP = async (req, res) => {
  try {
    const { admissionNo, otp } = req.body;

    if (!admissionNo || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Admission No and OTP are required',
      });
    }

    const student = await Student.findOne({
      admissionNo: admissionNo.trim().toUpperCase(),
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // Check OTP
    if (!student.parentRegOTP || student.parentRegOTP !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please check and try again.',
      });
    }

    // Check OTP expiry
    if (!student.parentRegOTPExpire || student.parentRegOTPExpire < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.',
      });
    }

    // Clear OTP after successful verification
    student.parentRegOTP       = undefined;
    student.parentRegOTPExpire = undefined;
    await student.save();

    res.json({
      success:     true,
      message:     'OTP verified successfully. Please complete your registration.',
      studentId:   student._id,
      studentName: `${student.firstName} ${student.lastName}`,
      admissionNo: student.admissionNo,
      fatherName:  student.father?.name  || '',
      motherName:  student.mother?.name  || '',
      course:      student.course?.name  || '',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── STEP 3 — POST /api/parent/register ───────────────────────────────────────
// Complete registration after OTP verified
export const register = async (req, res) => {
  try {
    const {
      name, phone, email, password,
      admissionNo, relation,
    } = req.body;

    // Find student by admission no
    const student = await Student.findOne({
      admissionNo: admissionNo?.trim().toUpperCase(),
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: `No student found with Admission No: ${admissionNo}`,
      });
    }

    // Check if this phone is already registered
    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      return res.status(400).json({
        success: false,
        message: 'This phone number is already registered. Please login instead.',
      });
    }

    // Allow multiple parents per student
    // Check how many parents already registered for this student
    const existingParents = await User.countDocuments({
      studentRef: student._id,
      role:       'parent',
    });

    if (existingParents >= 3) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 3 parent accounts already registered for this student.',
      });
    }

    // Create parent user
    const user = await User.create({
      name,
      phone,
      email:      email || undefined,
      password,
      role:       'parent',
      studentRef: student._id,
      relation:   relation || 'father',
    });

    console.log('Parent registered:', user._id, '→ student:', student._id);

    res.status(201).json({
      success: true,
      message: `Registered successfully as ${relation} of ${student.firstName} ${student.lastName}`,
      token: generateToken(user._id, 'parent'),
      user: {
        _id:        user._id,
        name:       user.name,
        phone:      user.phone,
        role:       'parent',
        relation:   user.relation,
        studentRef: student._id,
      },
    });
  } catch (err) {
    console.error('Parent register error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/parent/send-otp ─────────────────────────────────────────────────
// For existing parent login via OTP
export const sendOTP = async (req, res) => {
  try {
    const { phone } = req.body;
    const user = await User.findOne({ phone, role: 'parent' });
    if (!user)
      return res.status(404).json({ success: false, message: 'Parent not found' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp       = otp;
    user.otpExpire = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendSMS(
      phone,
      `Your College Portal login OTP is: ${otp}. Valid for 10 minutes.`
    );
    res.json({ success: true, message: `OTP sent to ${phone}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/parent/verify-otp ───────────────────────────────────────────────
// For existing parent login via OTP
export const verifyOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    const user = await User.findOne({ phone, role: 'parent' })
      .populate('studentRef');

    if (!user)
      return res.status(404).json({ success: false, message: 'Parent not found' });
    if (user.otp !== otp)
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    if (user.otpExpire < new Date())
      return res.status(400).json({ success: false, message: 'OTP expired' });

    user.otp       = undefined;
    user.otpExpire = undefined;
    await user.save();

    res.json({
      success: true,
      token: generateToken(user._id, 'parent'),
      user: {
        _id:        user._id,
        name:       user.name,
        phone:      user.phone,
        role:       'parent',
        relation:   user.relation,
        studentRef: user.studentRef,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/parent/dashboard ─────────────────────────────────────────────────
export const getDashboard = async (req, res) => {
  try {
    // Get full user with studentRef
    const fullUser = await User.findById(req.user._id).populate('studentRef');

    if (!fullUser?.studentRef) {
      return res.status(404).json({
        success: false,
        message: 'No student linked to this parent account',
      });
    }

    const studentId = fullUser.studentRef._id;

    const [
      student,
      fees,
      leaves,
      outpasses,
      checkins,
      circulars,
      recentPayments,
    ] = await Promise.all([
      Student.findById(studentId).populate('course', 'name'),
      StudentFees.find({ student: studentId }).sort('-createdAt').limit(5),
      Leave.find({ student: studentId }).sort('-createdAt').limit(5),
      Outpass.find({ student: studentId }).sort('-createdAt').limit(3),
      CheckIn.find({ student: studentId }).sort('-timestamp').limit(5),
      Circular.find({
        isPublished: true,
        $or: [
          { audience: 'all' },
          { audience: 'parents' },
          { audience: { $in: ['all', 'parents'] } },
        ],
      }).sort('-publishDate').limit(5),
      Payment.find({ student: studentId, status: 'success' })
        .sort('-paymentDate').limit(5),
    ]);

    const totalDue      = fees.reduce((s, f) => s + (f.totalDue || 0), 0);
    const pendingLeaves = leaves.filter(l => l.status === 'pending').length;

    res.json({
      success: true,
      student,
      summary: {
        totalDue,
        pendingLeaves,
        totalFees: fees.length,
      },
      fees,
      leaves,
      outpasses,
      checkins,
      circulars,
      recentPayments,
    });
  } catch (err) {
    console.error('Parent dashboard error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/parent/student ───────────────────────────────────────────────────
export const getStudent = async (req, res) => {
  try {
    const fullUser = await User.findById(req.user._id).populate('studentRef');

    if (!fullUser?.studentRef) {
      return res.status(404).json({
        success: false,
        message: 'No student linked',
      });
    }

    const student = await Student.findById(fullUser.studentRef._id)
      .populate('course', 'name code department');

    res.json({ success: true, student });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};