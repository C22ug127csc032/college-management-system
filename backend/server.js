import dns from "dns";

// Force DNS servers
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const cron = require('node-cron');

dotenv.config();

const app = express();

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth',       require('./routes/auth.routes'));
app.use('/api/students',   require('./routes/student.routes'));
app.use('/api/fees',       require('./routes/fees.routes'));
app.use('/api/payments',   require('./routes/payment.routes'));
app.use('/api/ledger',     require('./routes/ledger.routes'));
app.use('/api/leave',      require('./routes/leave.routes'));
app.use('/api/outpass',    require('./routes/outpass.routes'));
app.use('/api/checkin',    require('./routes/checkin.routes'));
app.use('/api/inventory',  require('./routes/inventory.routes'));
app.use('/api/expense',    require('./routes/expense.routes'));
app.use('/api/circulars',  require('./routes/circular.routes'));
app.use('/api/library',    require('./routes/library.routes'));
app.use('/api/shop',       require('./routes/shop.routes'));
app.use('/api/canteen',    require('./routes/canteen.routes'));
app.use('/api/reports',    require('./routes/report.routes'));
app.use('/api/staff',      require('./routes/staff.routes'));
app.use('/api/courses',    require('./routes/course.routes'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', time: new Date() }));

// Cron: Daily due-date alerts at 8 AM
cron.schedule('0 8 * * *', async () => {
  const { sendDueDateAlerts } = require('./utils/cronJobs');
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

module.exports = app;
