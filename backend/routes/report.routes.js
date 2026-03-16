// routes/report.routes.js
import express from 'express';
const r = express.Router();
import c from '../controllers/report.controller.js';
import middleware_auth_middleware from '../middleware/auth.middleware.js';
const { protect, adminOnly } = middleware_auth_middleware;
r.get('/dashboard', protect, c.getDashboard);
r.get('/fees', protect, adminOnly, c.getFeesReport);
r.get('/payments', protect, adminOnly, c.getPaymentReport);
r.get('/expenses', protect, adminOnly, c.getExpenseReport);
export default r;
