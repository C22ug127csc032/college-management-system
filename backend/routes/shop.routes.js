import express from 'express';
import * as c  from '../controllers/shop.controller.js';
import middleware_auth from '../middleware/auth.middleware.js';
const { protect, authorize } = middleware_auth;

const router = express.Router();

// ── Anyone with shop/canteen/admin role ───────────────────────────────────────
const shopOnly = authorize('shop_operator');

// ── Items ─────────────────────────────────────────────────────────────────────
router.get('/items',           protect, shopOnly, c.getItems);
router.post('/items',          protect, shopOnly, c.addItem);
router.put('/items/:id',       protect, shopOnly, c.updateItem);
router.delete('/items/:id',    protect, shopOnly, c.deleteItem);
router.post('/items/:id/stock',protect, shopOnly, c.updateStock);

// ── Find student ──────────────────────────────────────────────────────────────
router.get('/find/:identifier', protect, shopOnly, c.findStudent);

// ── Sales ─────────────────────────────────────────────────────────────────────
router.post('/sell',  protect, shopOnly, c.createSale);
router.get('/sales',  protect, shopOnly, c.getSales);

export default router;
