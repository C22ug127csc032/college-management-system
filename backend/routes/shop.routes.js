import express from 'express';
import * as c  from '../controllers/shop.controller.js';
import middleware_auth from '../middleware/auth.middleware.js';
const { protect, shopStaff } = middleware_auth;

const router = express.Router();

// ── Anyone with shop/canteen/admin role ───────────────────────────────────────

// ── Items ─────────────────────────────────────────────────────────────────────
router.get('/items',           protect, shopStaff, c.getItems);
router.post('/items',          protect, shopStaff, c.addItem);
router.put('/items/:id',       protect, shopStaff, c.updateItem);
router.delete('/items/:id',    protect, shopStaff, c.deleteItem);
router.post('/items/:id/stock',protect, shopStaff, c.updateStock);

// ── Find student ──────────────────────────────────────────────────────────────
router.get('/find/:identifier', protect, shopStaff, c.findStudent);

// ── Sales ─────────────────────────────────────────────────────────────────────
router.post('/sell',  protect, shopStaff, c.createSale);
router.get('/sales',  protect, shopStaff, c.getSales);

export default router;
