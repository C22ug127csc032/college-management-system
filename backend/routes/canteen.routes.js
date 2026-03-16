const express = require('express');
const r = express.Router();
const { shop } = require('../controllers/misc.controller');
const { protect, shopStaff } = require('../middleware/auth.middleware');

r.get('/items', protect, shop.getItems);
r.post('/items', protect, shopStaff, shop.addItem);
r.post('/sale', protect, shopStaff, shop.createSale);
r.get('/sales', protect, shopStaff, shop.getSales);

module.exports = r;
