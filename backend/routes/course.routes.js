const express = require('express');
const r = express.Router();
const Course = require('../models/Course.model');
const { protect, adminOnly } = require('../middleware/auth.middleware');

r.get('/', protect, async (req, res) => {
  try {
    const courses = await Course.find({ isActive: true }).populate('classTeacher', 'name').sort('name');
    res.json({ success: true, courses });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

r.post('/', protect, adminOnly, async (req, res) => {
  try {
    const course = await Course.create(req.body);
    res.status(201).json({ success: true, course });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

r.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, course });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

r.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Course.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Course deactivated' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = r;
