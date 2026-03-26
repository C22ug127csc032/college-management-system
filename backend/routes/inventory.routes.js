import express from 'express';
import {
  addTransaction,
  createItem,
  deleteItem,
  getAllItems,
  getInventoryStats,
  getItem,
  getTransactions,
  updateItem,
} from '../controllers/inventory.controller.js';
import { adminOnly, protect } from '../middleware/auth.middleware.js';

const r = express.Router();

r.get('/stats', protect, adminOnly, getInventoryStats);
r.get('/transactions', protect, adminOnly, getTransactions);
r.post('/transactions', protect, adminOnly, addTransaction);
r.get('/', protect, adminOnly, getAllItems);
r.post('/', protect, adminOnly, createItem);
r.get('/:id', protect, adminOnly, getItem);
r.put('/:id', protect, adminOnly, updateItem);
r.delete('/:id', protect, adminOnly, deleteItem);

export default r;
