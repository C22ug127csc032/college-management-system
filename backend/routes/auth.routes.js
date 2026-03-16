// routes/auth.routes.js
import express from 'express';
const r = express.Router();
import c from '../controllers/auth.controller.js';
import middleware_auth_middleware from '../middleware/auth.middleware.js';
const { protect, adminOnly } = middleware_auth_middleware;
r.post('/login', c.login);
r.post('/register', protect, adminOnly, c.register);
r.get('/me', protect, c.getMe);
r.put('/change-password', protect, c.changePassword);
r.get('/users', protect, adminOnly, c.getAllUsers);
r.put('/users/:id/toggle', protect, adminOnly, c.toggleUser);
export default r;
