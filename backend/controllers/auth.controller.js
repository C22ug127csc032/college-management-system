import User    from '../models/User.model.js';
import Student from '../models/Student.model.js';
import jwt     from 'jsonwebtoken';

const generateToken = (id, role) =>
  jwt.sign(
    { id, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );

// ── Helper — only for students ────────────────────────────────────────────────
const ensureStudentUserByPhone = async phone => {
  const normalizedPhone = (phone || '').trim();
  if (!normalizedPhone) return null;

  // Only create if a student record exists with this phone
  const student = await Student.findOne({ phone: normalizedPhone });
  if (!student) return null;

  // Check if user already exists
  let user = await User.findOne({ phone: normalizedPhone });
  if (user) return user;

  // Create student user with admissionNo as password
  user = await User.create({
    name:         `${student.firstName} ${student.lastName}`.trim(),
    phone:        student.phone,
    email:        student.email || undefined,
    password:     student.admissionNo || student.phone,
    role:         'student',
    studentRef:   student._id,
    isFirstLogin: true,
  });

  if (!student.userRef) {
    student.userRef = user._id;
    await student.save();
  }

  return User.findById(user._id).populate('studentRef');
};

// ── POST /api/auth/login ──────────────────────────────────────────────────────
export const login = async (req, res) => {
  try {
    const { identifier, phone, password, role } = req.body;
    const loginValue = (identifier || phone || '').trim();

    if (!loginValue || !password) {
      return res.status(400).json({
        success: false,
        message: 'Phone/Email and password are required',
      });
    }

    // ── Find user by phone or email ───────────────────────────────────────
    let user = await User.findOne({
      $or: [
        { phone: loginValue },
        { email: loginValue.toLowerCase() },
      ],
    }).populate('studentRef');

    // ── If not found AND looks like a phone — try student auto-create ─────
    // Only do this for student role or unknown role
    // NEVER for admin/staff email logins
    if (!user && /^\d+$/.test(loginValue)) {
      user = await ensureStudentUserByPhone(loginValue);
    }

    // ── No user found ─────────────────────────────────────────────────────
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Check your phone/email and password.',
      });
    }

    // ── Account active check ──────────────────────────────────────────────
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Contact admin.',
      });
    }

    // ── Role check — portal specific ──────────────────────────────────────
    if (role && user.role !== role) {
      return res.status(403).json({
        success: false,
        message: `This portal is for ${role} only`,
      });
    }

    // ── Verify password ───────────────────────────────────────────────────
    const passwordMatches = await user.matchPassword(password);

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Check your phone/email and password.',
      });
    }

    // ── Login success ─────────────────────────────────────────────────────
    res.json({
      success: true,
      token:   generateToken(user._id, user.role),
      user: {
        _id:          user._id,
        name:         user.name,
        phone:        user.phone,
        email:        user.email,
        role:         user.role,
        studentRef:   user.studentRef,
        avatar:       user.avatar,
        isFirstLogin: user.isFirstLogin || false,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/auth/register — Super Admin creates staff ───────────────────────
export const register = async (req, res) => {
  try {
    const { name, phone, email, password, role, staffId, department } = req.body;

    const exists = await User.findOne({ phone });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: 'Phone already registered',
      });
    }

    const user = await User.create({
      name, phone, email, password,
      role, staffId, department,
      isFirstLogin: false,
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: { _id: user._id, name: user.name, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('studentRef');
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PUT /api/auth/change-password ─────────────────────────────────────────────
export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters',
      });
    }

    const user = await User.findById(req.user.id);

    if (!(await user.matchPassword(oldPassword))) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    user.password     = newPassword;
    user.isFirstLogin = false;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PUT /api/auth/set-password — First login password setup ───────────────────
export const setFirstPassword = async (req, res) => {
  try {
    const { newPassword, confirmPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match',
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.password     = newPassword;
    user.isFirstLogin = false;
    await user.save();

    res.json({
      success:      true,
      message:      'Password set successfully. Welcome to the portal!',
      isFirstLogin: false,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/auth/users ───────────────────────────────────────────────────────
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: 'student' } })
      .select('-password')
      .sort('-createdAt');
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PUT /api/auth/users/:id/toggle ────────────────────────────────────────────
export const toggleUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    user.isActive = !user.isActive;
    await user.save();
    res.json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'}`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export default {
  login,
  register,
  getMe,
  changePassword,
  setFirstPassword,
  getAllUsers,
  toggleUser,
};