import express from 'express';
import * as c from '../controllers/report.controller.js';
import { protect, adminOnly } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/dashboard',  protect,            c.getDashboard);
router.get('/fees',       protect, adminOnly, c.getFeesReport);
router.get('/payments',   protect, adminOnly, c.getPaymentReport);
router.get('/expenses',   protect, adminOnly, c.getExpenseReport);
router.get('/inventory',  protect, adminOnly, c.getInventoryReport);
router.get('/library',    protect,            c.getLibraryReport);
router.get('/shop',       protect,            c.getShopReport);
router.get('/attendance', protect,            c.getAttendanceReport);

export default router;