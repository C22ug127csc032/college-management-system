const express = require('express');
const r = express.Router();
const c = require('../controllers/outpass.controller');
const { protect, hostelStaff } = require('../middleware/auth.middleware');
r.post('/', protect, c.createOutpass);
r.get('/', protect, c.getOutpasses);
r.put('/:id/status', protect, hostelStaff, c.updateOutpassStatus);
r.put('/:id/return', protect, hostelStaff, c.markReturned);
module.exports = r;
