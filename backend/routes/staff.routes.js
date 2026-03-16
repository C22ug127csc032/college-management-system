const express = require('express');
const r = express.Router();
const User = require('../models/User.model');
const { protect, adminOnly } = require('../middleware/auth.middleware');

r.get('/', protect, adminOnly, async (req, res) => {
  try {
    const staff = await User.find({ role: { $in: ['class_teacher','hostel_warden','shop_operator','canteen_operator','librarian'] } })
      .select('-password').sort('name');
    res.json({ success: true, staff });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

r.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-password');
    res.json({ success: true, user });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = r;
