// routes/checkin.routes.js
import express from 'express';
const r1 = express.Router();
import c1 from '../controllers/checkin.controller.js';
import middleware_auth_middleware from '../middleware/auth.middleware.js';
const { protect, hostelStaff } = middleware_auth_middleware;
r1.post('/', protect, hostelStaff, c1.record);
r1.get('/', protect, c1.getRecords);
export default r1;
