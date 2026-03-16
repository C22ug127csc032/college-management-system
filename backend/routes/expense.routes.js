const express = require('express');
const r = express.Router();
const { expense } = require('../controllers/misc.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');
r.get('/summary', protect, expense.getSummary);
r.get('/', protect, expense.getAll);
r.post('/', protect, adminOnly, expense.create);
module.exports = r;
