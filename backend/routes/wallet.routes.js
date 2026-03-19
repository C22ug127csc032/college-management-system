import express from 'express';
import * as c  from '../controllers/wallet.controller.js';
import middleware_auth from '../middleware/auth.middleware.js';
const { protect, adminOnly, authorize } = middleware_auth;

const router = express.Router();

// ── Student/Admin — view wallet ───────────────────────────────────────────────
router.get('/:studentId', protect, c.getWallet);

// ── Canteen/Shop — find student by phone or admissionNo ──────────────────────
router.get('/find/:identifier', protect, c.findStudentWallet);

// ── Parent — top up wallet ────────────────────────────────────────────────────
router.post('/topup/order',  protect, c.createTopupOrder);
router.post('/topup/verify', protect, c.verifyTopup);
router.post('/topup/manual', protect, c.manualTopup);

// ── Canteen operator — deduct from wallet ─────────────────────────────────────
router.post('/deduct/canteen', protect, c.canteenDeduct);

// ── Shop operator — deduct from wallet ────────────────────────────────────────
router.post('/deduct/shop', protect, c.shopDeduct);

export default router;