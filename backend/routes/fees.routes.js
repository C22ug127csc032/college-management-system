import express from 'express';
const r = express.Router();
import c from '../controllers/fees.controller.js';
import middleware_auth_middleware from '../middleware/auth.middleware.js';
const { protect, adminOnly, adminOrTeacher } = middleware_auth_middleware;

r.post('/structure', protect, adminOnly, c.createStructure);
r.get('/structure', protect, c.getAllStructures);
r.get('/structure/:id', protect, c.getStructure);
r.put('/structure/:id', protect, adminOnly, c.updateStructure);
r.put('/structure/:id/reactivate', protect, adminOnly, c.reactivateStructure);
r.delete('/structure/:id', protect, adminOnly, c.deactivateStructure);
r.delete('/structure/:id/permanent', protect, adminOnly, c.deleteStructurePermanent);

r.post('/assign', protect, adminOnly, c.assignFees);
r.get('/summary', protect, adminOnly, c.getFeesSummary);
r.get('/all', protect, adminOrTeacher, c.getAllStudentFees);
r.get('/student/:studentId', protect, c.getStudentFees);
export default r;
