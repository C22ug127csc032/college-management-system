const express = require('express');
const r = express.Router();
const c = require('../controllers/fees.controller');
const { protect, adminOnly, adminOrTeacher } = require('../middleware/auth.middleware');

r.post('/structure', protect, adminOnly, c.createStructure);
r.get('/structure', protect, c.getAllStructures);
r.get('/structure/:id', protect, c.getStructure);
r.put('/structure/:id', protect, adminOnly, c.updateStructure);

r.post('/assign', protect, adminOnly, c.assignFees);
r.get('/summary', protect, adminOnly, c.getFeesSummary);
r.get('/all', protect, adminOrTeacher, c.getAllStudentFees);
r.get('/student/:studentId', protect, c.getStudentFees);
module.exports = r;
