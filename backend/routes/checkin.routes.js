// routes/checkin.routes.js
const express = require('express');
const r1 = express.Router();
const c1 = require('../controllers/checkin.controller');
const { protect, hostelStaff } = require('../middleware/auth.middleware');
r1.post('/', protect, c1.record);
r1.get('/', protect, c1.getRecords);
module.exports = r1;
