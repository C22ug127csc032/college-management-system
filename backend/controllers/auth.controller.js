import User    from '../models/User.model.js';
import Student from '../models/Student.model.js';
import jwt     from 'jsonwebtoken';
import { assertValidIndianPhone, isValidIndianPhone, normalizePhone } from '../utils/phone.js';
import { getPreferredStudentIdentifier, getPreferredStudentIdentifierLabel } from '../utils/studentIdentity.js';

const generateToken = (id, role) =>
  jwt.sign(
    { id, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );

const normalizeOperatorRole = role =>
  role === 'canteen_operator' ? 'shop_operator' : role;

const ensureUnifiedOperatorRole = async user => {
  if (user?.role === 'canteen_operator') {
    user.role = 'shop_operator';
    await user.save();
  }
  return user;
};

// ── Helper — only for students ────────────────────────────────────────────────
const ensureStudentUserByPhone = async phone => {
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) return null;

  const student = await Student.findOne({ phone: normalizedPhone });
  if (!student) return null;

  let user = await User.findOne({ phone: normalizedPhone });
  if (user) return user;

  user = await User.create({
    name:         `${student.firstName} ${student.lastName}`.trim(),
    phone:        student.phone,
    email:        student.email || undefined,
    password:     getPreferredStudentIdentifier(student) || student.phone,
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
    const normalizedPhone = normalizePhone(loginValue);

    if (!loginValue || !password) {
      return res.status(400).json({
        success: false,
        message: 'Phone/Email and password are required',
      });
    }
    if (/^\d+$/.test(loginValue) && !isValidIndianPhone(loginValue)) {
      return res.status(400).json({
        success: false,
        message: 'Phone number must be a valid 10-digit Indian mobile number',
      });
    }

    // ── Find user ─────────────────────────────────────────────────────────
    const loginQueries = [];
    if (isValidIndianPhone(loginValue)) {
      loginQueries.push({ phone: normalizedPhone });
    }
    if (loginValue.includes('@')) {
      loginQueries.push({ email: loginValue.toLowerCase() });
    }

    let user = loginQueries.length
      ? await User.findOne({ $or: loginQueries }).populate('studentRef')
      : null;

    // ── Auto create student user if not found ─────────────────────────────
    if (!user && /^\d+$/.test(loginValue) && isValidIndianPhone(loginValue)) {
      user = await ensureStudentUserByPhone(normalizedPhone);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'No account found with this phone or email.',
      });
    }

    user = await ensureUnifiedOperatorRole(user);

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account deactivated. Contact admin.',
      });
    }

    if (role && user.role !== role) {
      return res.status(403).json({
        success: false,
        message: `This portal is for ${role} only`,
      });
    }

    // ── Try password as submitted ─────────────────────────────────────────
    let passwordMatches = await user.matchPassword(password);

    // ── Smart fallback for students ───────────────────────────────────────
    // Handles 3 cases:
    // 1. Student has old phone-as-password hash -> migrate to rollNo/admissionNo
    // 2. Student has rollNo/admissionNo hash but submitted the plain default credential
    // 3. Student has no academic identifier yet -> allow phone as password
    if (!passwordMatches && user.role === 'student') {
      const student = await Student.findById(
        user.studentRef?._id || user.studentRef
      ).select('rollNo admissionNo phone firstName lastName');

      if (student) {
        const defaultCredential = getPreferredStudentIdentifier(student);
        const credentialLabel = getPreferredStudentIdentifierLabel(student);
        const phone    = student.phone || user.phone || '';

        // Case 1 — submitted the default academic identifier but hash is outdated
        // Force rehash and retry
        if (defaultCredential && password === defaultCredential) {
          user.password     = defaultCredential;
          user.isFirstLogin = true;
          await user.save();
          passwordMatches = await user.matchPassword(password);
        }

        // Case 2 — submitted phone number (old default password)
        else if (password === phone) {
          if (defaultCredential) {
            // Has roll no/admission no — migrate to the current default academic credential
            user.password     = defaultCredential;
            user.isFirstLogin = true;
            await user.save();
            return res.status(401).json({
              success:  false,
              message:  `Your default password has been updated to your ${credentialLabel}. Please use: ${defaultCredential}`,
              hint:     defaultCredential,
              migrated: true,
            });
          } else {
            // No roll no/admission no yet — allow phone as password temporarily
            user.password = phone;
            await user.save();
            passwordMatches = await user.matchPassword(password);
          }
        }
      }
    }

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: user.role === 'student'
          ? 'Invalid password. Use your Roll No as default password. If Roll No is not assigned yet, use your Admission No.'
          : 'Invalid email/phone or password.',
      });
    }

    // ── Success ───────────────────────────────────────────────────────────
    res.json({
      success: true,
      token:   generateToken(user._id, normalizeOperatorRole(user.role)),
      user: {
        _id:          user._id,
        name:         user.name,
        phone:        user.phone,
        email:        user.email,
        role:         normalizeOperatorRole(user.role),
        studentRef:   user.studentRef,
        avatar:       user.avatar,
        isFirstLogin: user.isFirstLogin || false,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    const status = /phone number/i.test(err.message) ? 400 : 500;
    res.status(status).json({ success: false, message: err.message });
  }
};

// ── POST /api/auth/register ───────────────────────────────────────────────────
export const register = async (req, res) => {
  try {
    const { name, phone, email, password, role, staffId, department } = req.body;
    const normalizedRole = normalizeOperatorRole(role);
    const cleanName = String(name || '').trim();
    const cleanPhone = assertValidIndianPhone(phone);
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanDepartment = String(department || '').trim();

    if (!cleanName || !cleanPhone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, phone and password are required',
      });
    }

    const exists = await User.findOne({ phone: cleanPhone });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: 'Phone already registered',
      });
    }

    if (cleanEmail) {
      const emailExists = await User.findOne({ email: cleanEmail });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email already registered',
        });
      }
    }

    const user = await User.create({
      name: cleanName,
      phone: cleanPhone,
      email: cleanEmail || undefined,
      password,
      role: normalizedRole,
      staffId,
      department: cleanDepartment || undefined,
      isFirstLogin: false,
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: { _id: user._id, name: user.name, role: normalizeOperatorRole(user.role) },
    });
  } catch (err) {
    const status = err.code === 11000 ? 400 : 500;
    const message =
      err.code === 11000
        ? 'Phone or email already registered'
        : err.message;
    res.status(/phone number/i.test(message) ? 400 : status).json({ success: false, message });
  }
};

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('studentRef');
    res.json({
      success: true,
      user: { ...user.toObject(), role: normalizeOperatorRole(user.role) },
    });
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

// ── PUT /api/auth/set-password ────────────────────────────────────────────────
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
