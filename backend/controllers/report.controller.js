const Payment = require('../models/Payment.model');
const StudentFees = require('../models/StudentFees.model');
const Student = require('../models/Student.model');
const Expense = require('../models/Expense.model');
const { Inventory } = require('../models/Inventory.model');
const { ShopSale } = require('../models/Shop.model');
const { BookIssue } = require('../models/Library.model');

// @GET /api/reports/dashboard
exports.getDashboard = async (req, res) => {
  try {
    const today = new Date();
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalStudents, activeStudents,
      totalFeesCollected, monthlyCollection,
      pendingDues, expenseThisMonth,
      recentPayments, overdueCount,
    ] = await Promise.all([
      Student.countDocuments(),
      Student.countDocuments({ status: 'active' }),
      Payment.aggregate([{ $match: { status: 'success' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Payment.aggregate([{ $match: { status: 'success', paymentDate: { $gte: thisMonth } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      StudentFees.aggregate([{ $group: { _id: null, total: { $sum: '$totalDue' } } }]),
      Expense.aggregate([{ $match: { date: { $gte: thisMonth } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Payment.find({ status: 'success' }).populate('student', 'firstName lastName regNo').sort('-paymentDate').limit(5),
      StudentFees.countDocuments({ status: 'overdue' }),
    ]);

    res.json({
      success: true,
      dashboard: {
        totalStudents,
        activeStudents,
        totalFeesCollected: totalFeesCollected[0]?.total || 0,
        monthlyCollection: monthlyCollection[0]?.total || 0,
        pendingDues: pendingDues[0]?.total || 0,
        expenseThisMonth: expenseThisMonth[0]?.total || 0,
        recentPayments,
        overdueCount,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/reports/fees
exports.getFeesReport = async (req, res) => {
  try {
    const { academicYear, course, status, startDate, endDate } = req.query;
    const query = {};
    if (academicYear) query.academicYear = academicYear;
    if (status) query.status = status;

    const fees = await StudentFees.find(query)
      .populate({ path: 'student', select: 'firstName lastName regNo phone', populate: { path: 'course', select: 'name' } })
      .sort('-createdAt');

    const summary = {
      totalBilled: fees.reduce((s, f) => s + f.totalAmount, 0),
      totalCollected: fees.reduce((s, f) => s + f.totalPaid, 0),
      totalDue: fees.reduce((s, f) => s + (f.totalDue || 0), 0),
      paid: fees.filter(f => f.status === 'paid').length,
      partial: fees.filter(f => f.status === 'partial').length,
      pending: fees.filter(f => f.status === 'pending').length,
      overdue: fees.filter(f => f.status === 'overdue').length,
    };

    res.json({ success: true, fees, summary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/reports/payments
exports.getPaymentReport = async (req, res) => {
  try {
    const { startDate, endDate, paymentMode } = req.query;
    const query = { status: 'success' };
    if (paymentMode) query.paymentMode = paymentMode;
    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) query.paymentDate.$gte = new Date(startDate);
      if (endDate) query.paymentDate.$lte = new Date(endDate);
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

// @GET /api/reports/expenses
exports.getExpenseReport = async (req, res) => {
  try {
    const { startDate, endDate, category, academicYear } = req.query;
    const query = {};
    if (category) query.category = category;
    if (academicYear) query.academicYear = academicYear;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    const expenses = await Expense.find(query).populate('enteredBy', 'name').sort('-date');
    const totalAmount = expenses.reduce((s, e) => s + e.amount, 0);
    const byCategory = await Expense.aggregate([
      { $match: query },
      { $group: { _id: '$category', total: { $sum: '$amount' } } }
    ]);
    res.json({ success: true, expenses, totalAmount, byCategory });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
