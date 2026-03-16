// routes/leave.routes.js
const express = require('express');
const r = express.Router();
const c = require('../controllers/leave.controller');
const { protect, adminOrTeacher, hostelStaff } = require('../middleware/auth.middleware');
r.post('/', protect, c.applyLeave);
r.get('/', protect, c.getLeaves);
r.get('/:id', protect, c.getLeave);
r.put('/:id/status', protect, adminOrTeacher, c.updateLeaveStatus);
module.exports = r;
