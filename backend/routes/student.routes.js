import express from 'express';
const r = express.Router();
import c from '../controllers/student.controller.js';
import middleware_auth_middleware from '../middleware/auth.middleware.js';
const { protect, adminOnly, adminOrTeacher } = middleware_auth_middleware;
import upload from '../middleware/upload.middleware.js';

r.get('/stats/summary', protect, adminOrTeacher, c.getStudentStats);
r.get('/reg/:regNo', protect, c.getStudentByRegNo);
r.get('/', protect, adminOrTeacher, c.getAllStudents);
r.post('/', protect, adminOnly, upload.single('photo'), c.createStudent);
r.get('/:id', protect, c.getStudent);
r.put('/:id', protect, adminOrTeacher, upload.single('photo'), c.updateStudent);
r.delete('/:id', protect, adminOnly, c.deleteStudent);
r.get('/:id/ledger', protect, c.getStudentLedger);
export default r;
