import express from 'express';
import * as c from '../controllers/wallet.controller.js';
import { protect, adminOnly } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/:studentId',        protect,            c.getWallet);
router.post('/topup/order',      protect,            c.createTopupOrder);
router.post('/topup/verify',     protect,            c.verifyTopup);
router.post('/topup/manual',     protect, adminOnly, c.manualTopup);

export default router;
