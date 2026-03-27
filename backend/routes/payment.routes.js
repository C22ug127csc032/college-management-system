import express from 'express';
const r = express.Router();
import c from '../controllers/payment.controller.js';
import middleware_auth_middleware from '../middleware/auth.middleware.js';
const { protect, financeStaff } = middleware_auth_middleware;

r.post('/create-order', protect, c.createOrder);
r.post('/verify', protect, c.verifyPayment);
r.post('/manual', protect, financeStaff, c.manualPayment);
r.get('/receipt/:id', protect, c.downloadReceipt);
r.get('/student/:studentId', protect, c.getStudentPayments);
r.get('/', protect, financeStaff, c.getAllPayments);
export default r;
