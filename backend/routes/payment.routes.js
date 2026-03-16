const express = require('express');
const r = express.Router();
const c = require('../controllers/payment.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');

r.post('/create-order', protect, c.createOrder);
r.post('/verify', protect, c.verifyPayment);
r.post('/manual', protect, adminOnly, c.manualPayment);
r.get('/receipt/:id', protect, c.downloadReceipt);
r.get('/student/:studentId', protect, c.getStudentPayments);
r.get('/', protect, adminOnly, c.getAllPayments);
module.exports = r;
