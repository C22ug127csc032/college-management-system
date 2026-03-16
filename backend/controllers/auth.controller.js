const User = require('../models/User.model');
const Student = require('../models/Student.model');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const generateToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

// @POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { phone, password, role } = req.body;
    const user = await User.findOne({ phone }).populate('studentRef');
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    if (!user.isActive)
      return res.status(403).json({ success: false, message: 'Account deactivated' });
    if (role && user.role !== role)
      return res.status(403).json({ success: false, message: 'Unauthorized role' });

    res.json({
      success: true,
      token: generateToken(user._id, user.role),
      user: {
        _id: user._id, name: user.name, phone: user.phone,
        email: user.email, role: user.role,
        studentRef: user.studentRef, avatar: user.avatar,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/auth/register  (Super Admin creates users)
exports.register = async (req, res) => {
  try {
    const { name, phone, email, password, role, staffId, department } = req.body;
    const exists = await User.findOne({ phone });
    if (exists) return res.status(400).json({ success: false, message: 'Phone already registered' });

    const user = await User.create({ name, phone, email, password, role, staffId, department });
    res.status(201).json({ success: true, message: 'User created', user: { _id: user._id, name: user.name, role: user.role } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password').populate('studentRef');
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @PUT /api/auth/change-password
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    if (!(await user.matchPassword(oldPassword)))
      return res.status(400).json({ success: false, message: 'Old password incorrect' });
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/auth/users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: 'student' } }).select('-password').sort('-createdAt');
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @PUT /api/auth/users/:id/toggle
exports.toggleUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
