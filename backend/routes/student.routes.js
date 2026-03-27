import express from 'express';
const r = express.Router();
import c from '../controllers/student.controller.js';
import middleware_auth_middleware from '../middleware/auth.middleware.js';
const {
  protect,
  adminOnly,
  adminOrTeacher,
  studentOfficeStaff,
  studentManagementStaff,
  studentEnrollmentStaff,
} = middleware_auth_middleware;
import upload from '../middleware/upload.middleware.js';

// ── Stats & Special routes first ──────────────────────────────────────────────
r.get('/stats/summary',             protect, studentOfficeStaff, c.getStudentStats);
r.get('/adm/:admissionNo',          protect,                 c.getStudentByAdmissionNo);
r.get('/reg/:regNo',                protect,                 c.getStudentByRegNo);
r.get('/lookup/:identifier',        protect,                 c.getStudentByIdentifier);
r.get('/class-strength/:className', protect, studentOfficeStaff, c.getClassStrength);
r.post('/generate-roll-nos',        protect, adminOrTeacher, c.generateCourseWiseRollNos);

// ── Promote routes ────────────────────────────────────────────────────────────
r.post('/promote',        protect, adminOnly, c.promoteClass);
r.post('/promote-single', protect, adminOnly, c.promoteSingle);

// ── Main CRUD routes ──────────────────────────────────────────────────────────
r.get('/',    protect, studentOfficeStaff,                     c.getAllStudents);
r.post('/',   protect, studentManagementStaff, upload.single('photo'), c.createStudent);
r.get('/:id', protect,                                         c.getStudent);
r.put('/:id', protect, studentEnrollmentStaff, upload.single('photo'), c.updateStudent);
r.delete('/:id', protect, adminOnly,                           c.deactivateStudent);

// ── Sub routes ────────────────────────────────────────────────────────────────
r.get('/:id/ledger', protect, c.getStudentLedger);

export default r;
