import express from 'express';
const r = express.Router();
import User from '../models/User.model.js';
import middleware_auth_middleware from '../middleware/auth.middleware.js';
const { protect, superAdminOnly } = middleware_auth_middleware;

r.get('/', protect, superAdminOnly, async (req, res) => {
  try {
    const staff = await User.find({ role: { $in: ['admin','class_teacher','hostel_warden','shop_operator','canteen_operator','librarian','accountant','admission_staff'] } })
      .select('-password').sort('name');
    res.json({ success: true, staff });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

r.put('/:id', protect, superAdminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-password');
    res.json({ success: true, user });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

export default r;
