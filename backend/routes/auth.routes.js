import express from 'express';
import * as authController from '../controllers/auth.controller.js';
import * as otpController  from '../controllers/otp.controller.js';
import { protect, adminOnly } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/login',                       authController.login);
router.post('/register',  protect, adminOnly, authController.register);
router.get('/me',         protect,           authController.getMe);
router.put('/change-password', protect,      authController.changePassword);
router.get('/users',      protect, adminOnly, authController.getAllUsers);
router.put('/users/:id/toggle', protect, adminOnly, authController.toggleUser);

// OTP routes
router.post('/send-otp',   otpController.sendOTP);
router.post('/verify-otp', otpController.verifyOTP);

export default router;
