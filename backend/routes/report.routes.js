// routes/report.routes.js
const express = require('express');
const r = express.Router();
const c = require('../controllers/report.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');
r.get('/dashboard', protect, c.getDashboard);
r.get('/fees', protect, adminOnly, c.getFeesReport);
r.get('/payments', protect, adminOnly, c.getPaymentReport);
r.get('/expenses', protect, adminOnly, c.getExpenseReport);
module.exports = r;
