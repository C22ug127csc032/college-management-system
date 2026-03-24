import express from 'express';
import * as authController from '../controllers/auth.controller.js';
import * as otpController  from '../controllers/otp.controller.js';
import { protect, superAdminOnly } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/login',                          authController.login);
router.post('/register',   protect, superAdminOnly, authController.register);
router.get('/me',          protect,            authController.getMe);
router.put('/change-password', protect,        authController.changePassword);
router.put('/set-password',    protect,        authController.setFirstPassword); // ← new
router.get('/users',       protect, superAdminOnly, authController.getAllUsers);
router.put('/users/:id/toggle', protect, superAdminOnly, authController.toggleUser);

// OTP routes
router.post('/send-otp',   otpController.sendOTP);
router.post('/verify-otp', otpController.verifyOTP);

export default router;
