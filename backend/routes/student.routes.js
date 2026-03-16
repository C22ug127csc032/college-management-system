const express = require('express');
const r = express.Router();
const c = require('../controllers/student.controller');
const { protect, adminOnly, adminOrTeacher } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

r.get('/stats/summary', protect, adminOrTeacher, c.getStudentStats);
r.get('/reg/:regNo', protect, c.getStudentByRegNo);
r.get('/', protect, adminOrTeacher, c.getAllStudents);
r.post('/', protect, adminOnly, upload.single('photo'), c.createStudent);
r.get('/:id', protect, c.getStudent);
r.put('/:id', protect, adminOrTeacher, upload.single('photo'), c.updateStudent);
r.delete('/:id', protect, adminOnly, c.deleteStudent);
r.get('/:id/ledger', protect, c.getStudentLedger);
module.exports = r;
