import Payment from '../models/Payment.model.js';
import StudentFees from '../models/StudentFees.model.js';
import Student from '../models/Student.model.js';
import Expense from '../models/Expense.model.js';
import { Inventory, InventoryTransaction } from '../models/Inventory.model.js';
import { ShopSale } from '../models/Shop.model.js';
import { Book, BookIssue } from '../models/Library.model.js';
import CheckIn from '../models/CheckIn.model.js';

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
export const getDashboard = async (req, res) => {
  try {
    const today = new Date();
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalStudents,
      activeStudents,
      totalFeesCollected,
      monthlyCollection,
      pendingDues,
      expenseThisMonth,
      recentPayments,
      overdueCount,
    ] = await Promise.all([
      Student.countDocuments(),
      Student.countDocuments({ status: 'active' }),
      Payment.aggregate([
        { $match: { status: 'success' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Payment.aggregate([
        { $match: { status: 'success', paymentDate: { $gte: thisMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      StudentFees.aggregate([
        { $group: { _id: null, total: { $sum: '$totalDue' } } },
      ]),
      Expense.aggregate([
        { $match: { date: { $gte: thisMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Payment.find({ status: 'success' })
        .populate('student', 'firstName lastName regNo')
        .sort('-paymentDate')
        .limit(5),
      StudentFees.countDocuments({ status: 'overdue' }),
    ]);

    res.json({
      success: true,
      dashboard: {
        totalStudents,
        activeStudents,
        totalFeesCollected: totalFeesCollected[0]?.total || 0,
        monthlyCollection:  monthlyCollection[0]?.total  || 0,
        pendingDues:        pendingDues[0]?.total         || 0,
        expenseThisMonth:   expenseThisMonth[0]?.total    || 0,
        recentPayments,
        overdueCount,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── FEES REPORT ──────────────────────────────────────────────────────────────
export const getFeesReport = async (req, res) => {
  try {
    const { academicYear, status } = req.query;
    const query = {};
    if (academicYear) query.academicYear = academicYear;
    if (status)       query.status       = status;

    const fees = await StudentFees.find(query)
      .populate({
        path: 'student',
        select: 'firstName lastName regNo phone',
        populate: { path: 'course', select: 'name' },
      })
      .sort('-createdAt');

    const summary = {
      totalBilled:    fees.reduce((s, f) => s + f.totalAmount,       0),
      totalCollected: fees.reduce((s, f) => s + f.totalPaid,         0),
      totalDue:       fees.reduce((s, f) => s + (f.totalDue || 0),   0),
      paid:           fees.filter(f => f.status === 'paid').length,
      partial:        fees.filter(f => f.status === 'partial').length,
      pending:        fees.filter(f => f.status === 'pending').length,
      overdue:        fees.filter(f => f.status === 'overdue').length,
    };

    res.json({ success: true, fees, summary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── PAYMENTS REPORT ──────────────────────────────────────────────────────────
export const getPaymentReport = async (req, res) => {
  try {
    const { startDate, endDate, paymentMode } = req.query;
    const query = { status: 'success' };
    if (paymentMode) query.paymentMode = paymentMode;
    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) query.paymentDate.$gte = new Date(startDate);
      if (endDate)   query.paymentDate.$lte = new Date(endDate);
    }

    const payments = await Payment.find(query)
      .populate('student', 'firstName lastName regNo')
      .sort('-paymentDate');

    const totalAmount = payments.reduce((s, p) => s + p.amount, 0);
    const byMode = payments.reduce((acc, p) => {
      acc[p.paymentMode] = (acc[p.paymentMode] || 0) + p.amount;
      return acc;
    }, {});

    res.json({ success: true, payments, totalAmount, byMode });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── EXPENSE REPORT ───────────────────────────────────────────────────────────
export const getExpenseReport = async (req, res) => {
  try {
    const { startDate, endDate, category, academicYear } = req.query;
    const query = {};
    if (category)     query.category     = category;
    if (academicYear) query.academicYear = academicYear;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate)   query.date.$lte = new Date(endDate);
    }

    const expenses = await Expense.find(query)
      .populate('enteredBy', 'name')
      .sort('-date');

    const totalAmount = expenses.reduce((s, e) => s + e.amount, 0);
    const byCategory  = await Expense.aggregate([
      { $match: query },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
    ]);

    res.json({ success: true, expenses, totalAmount, byCategory });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── INVENTORY REPORT ─────────────────────────────────────────────────────────
export const getInventoryReport = async (req, res) => {
  try {
    const { category } = req.query;
    const query = category ? { category } : {};

    const items        = await Inventory.find(query).sort('name');
    const transactions = await InventoryTransaction.find()
      .populate('inventory', 'name category unit')
      .sort('-date')
      .limit(100);

    const lowStockItems = items.filter(i => i.currentStock <= i.minStockAlert);
    const totalValue    = items.reduce((s, i) => s + (i.currentStock * i.purchasePrice), 0);
    const byCategory    = await Inventory.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalValue: { $sum: { $multiply: ['$currentStock', '$purchasePrice'] } },
        },
      },
    ]);

    res.json({ success: true, items, transactions, lowStockItems, totalValue, byCategory });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── LIBRARY REPORT ───────────────────────────────────────────────────────────
export const getLibraryReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};
    if (startDate || endDate) {
      query.issueDate = {};
      if (startDate) query.issueDate.$gte = new Date(startDate);
      if (endDate)   query.issueDate.$lte = new Date(endDate);
    }

    const issues = await BookIssue.find(query)
      .populate('book',    'title author')
      .populate('student', 'firstName lastName regNo')
      .sort('-issueDate');

    const totalBooks    = await Book.countDocuments({ isActive: true });
    const totalIssued   = issues.length;
    const totalReturned = issues.filter(i => i.status === 'returned').length;
    const overdue       = issues.filter(i =>
      i.status === 'overdue' ||
      (i.status === 'issued' && new Date(i.dueDate) < new Date())
    ).length;
    const totalFine = issues.reduce((s, i) => s + (i.fine || 0), 0);

    res.json({
      success: true,
      issues,
      summary: { totalBooks, totalIssued, totalReturned, overdue, totalFine },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── SHOP REPORT ──────────────────────────────────────────────────────────────
export const getShopReport = async (req, res) => {
  try {
    const { type = 'shop', startDate, endDate } = req.query;
    const query = { type };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate)   query.date.$lte = new Date(endDate);
    }

    const sales = await ShopSale.find(query)
      .populate('student', 'firstName lastName regNo')
      .sort('-date');

    const totalRevenue = sales
      .filter(s => s.status === 'paid')
      .reduce((s, r) => s + r.totalAmount, 0);

    const totalCredit = sales
      .filter(s => s.status === 'credit')
      .reduce((s, r) => s + r.totalAmount, 0);

    const dailySales = await ShopSale.aggregate([
      { $match: query },
      {
        $group: {
          _id:   { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          total: { $sum: '$totalAmount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
      { $limit: 30 },
    ]);

    res.json({
      success: true,
      sales,
      summary: { totalRevenue, totalCredit, totalSales: sales.length },
      dailySales,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── ATTENDANCE REPORT ────────────────────────────────────────────────────────
export const getAttendanceReport = async (req, res) => {
  try {
    const { startDate, endDate, location } = req.query;
    const query = {};
    if (location) query.location = location;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate)   query.timestamp.$lte = new Date(endDate);
    }

    const records = await CheckIn.find(query)
      .populate('student', 'firstName lastName regNo')
      .sort('-timestamp')
      .limit(200);

    res.json({ success: true, records, total: records.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};