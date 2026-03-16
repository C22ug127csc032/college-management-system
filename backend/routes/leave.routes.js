// routes/leave.routes.js
import express from 'express';
const r = express.Router();
import c from '../controllers/leave.controller.js';
import middleware_auth_middleware from '../middleware/auth.middleware.js';
const { protect, adminOrTeacher, hostelStaff } = middleware_auth_middleware;
r.post('/', protect, c.applyLeave);
r.get('/', protect, c.getLeaves);
r.get('/:id', protect, c.getLeave);
r.put('/:id/status', protect, adminOrTeacher, c.updateLeaveStatus);
export default r;
