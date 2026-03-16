import dns from "dns";

// Force DNS servers
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import cron from 'node-cron';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

import authRoutes         from './routes/auth.routes.js';
import studentRoutes      from './routes/student.routes.js';
import feesRoutes         from './routes/fees.routes.js';
import paymentRoutes      from './routes/payment.routes.js';
import ledgerRoutes       from './routes/ledger.routes.js';
import leaveRoutes        from './routes/leave.routes.js';
import outpassRoutes      from './routes/outpass.routes.js';
import checkinRoutes      from './routes/checkin.routes.js';
import inventoryRoutes    from './routes/inventory.routes.js';
import expenseRoutes      from './routes/expense.routes.js';
import circularRoutes     from './routes/circular.routes.js';
import libraryRoutes      from './routes/library.routes.js';
import shopRoutes         from './routes/shop.routes.js';
import canteenRoutes      from './routes/canteen.routes.js';
import reportRoutes       from './routes/report.routes.js';
import staffRoutes        from './routes/staff.routes.js';
import courseRoutes       from './routes/course.routes.js';
import parentRoutes       from './routes/parent.routes.js';
import walletRoutes       from './routes/wallet.routes.js';
import notificationRoutes from './routes/notification.routes.js';

app.use('/api/auth',          authRoutes);
app.use('/api/students',      studentRoutes);
app.use('/api/fees',          feesRoutes);
app.use('/api/payments',      paymentRoutes);
app.use('/api/ledger',        ledgerRoutes);
app.use('/api/leave',         leaveRoutes);
app.use('/api/outpass',       outpassRoutes);
app.use('/api/checkin',       checkinRoutes);
app.use('/api/inventory',     inventoryRoutes);
app.use('/api/expense',       expenseRoutes);
app.use('/api/circulars',     circularRoutes);
app.use('/api/library',       libraryRoutes);
app.use('/api/shop',          shopRoutes);
app.use('/api/canteen',       canteenRoutes);
app.use('/api/reports',       reportRoutes);
app.use('/api/staff',         staffRoutes);
app.use('/api/courses',       courseRoutes);
app.use('/api/parent',        parentRoutes);
app.use('/api/wallet',        walletRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'OK', time: new Date() }));

cron.schedule('0 8 * * *', async () => {
  const { sendDueDateAlerts } = await import('./utils/cronJobs.js');
  await sendDueDateAlerts();
});

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('âœ… MongoDB connected');
    app.listen(process.env.PORT || 5000, () =>
      console.log(`ðŸš€ Server running on port ${process.env.PORT || 5000}`)
    );
  })
  .catch(err => { console.error('âŒ DB Error:', err); process.exit(1); });

export default app;
