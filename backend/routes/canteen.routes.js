import express from 'express';
const r = express.Router();
import controllers_misc_controller from '../controllers/misc.controller.js';
const { shop } = controllers_misc_controller;
import middleware_auth_middleware from '../middleware/auth.middleware.js';
const { protect, shopStaff } = middleware_auth_middleware;

r.get('/items', protect, shop.getItems);
r.post('/items', protect, shopStaff, shop.addItem);
r.post('/sale', protect, shopStaff, shop.createSale);
r.get('/sales', protect, shopStaff, shop.getSales);

export default r;
