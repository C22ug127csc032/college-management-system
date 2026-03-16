import express from 'express';
import Notification from '../models/Notification.model.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// GET all my notifications
router.get('/', protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id })
      .sort('-sentAt').limit(50);
    const unreadCount = await Notification.countDocuments({
      recipient: req.user.id, isRead: false,
    });
    res.json({ success: true, notifications, unreadCount });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Mark all as read
router.put('/read-all', protect, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, isRead: false },
      { isRead: true }
    );
    res.json({ success: true, message: 'All marked as read' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Mark one as read
router.put('/:id/read', protect, async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

export default router;
