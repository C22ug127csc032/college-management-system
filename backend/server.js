const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const cron = require('node-cron');

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const { sendDueDateAlerts } = cronJobs;

const app = express();

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/fees', feesRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/ledger', ledgerRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/outpass', outpassRoutes);
app.use('/api/checkin', checkinRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/expense', expenseRoutes);
app.use('/api/circulars', circularRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/canteen', canteenRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/courses', courseRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', time: new Date() }));

// Cron: Daily due-date alerts at 8 AM
cron.schedule('0 8 * * *', async () => {
  await sendDueDateAlerts();
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(process.env.PORT || 5000, () =>
      console.log(`🚀 Server running on port ${process.env.PORT || 5000}`)
    );
  })
  .catch(err => { console.error('❌ DB Error:', err); process.exit(1); });

export default app;
