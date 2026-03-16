const express = require('express');
const r = express.Router();
const { circular } = require('../controllers/misc.controller');
const { protect, adminOrTeacher } = require('../middleware/auth.middleware');
r.get('/', protect, circular.getAll);
r.post('/', protect, adminOrTeacher, circular.create);
r.put('/:id', protect, adminOrTeacher, circular.update);
r.delete('/:id', protect, adminOrTeacher, circular.delete);
module.exports = r;
