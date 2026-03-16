// routes/auth.routes.js
const express = require('express');
const r = express.Router();
const c = require('../controllers/auth.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');
r.post('/login', c.login);
r.post('/register', protect, adminOnly, c.register);
r.get('/me', protect, c.getMe);
r.put('/change-password', protect, c.changePassword);
r.get('/users', protect, adminOnly, c.getAllUsers);
r.put('/users/:id/toggle', protect, adminOnly, c.toggleUser);
module.exports = r;
