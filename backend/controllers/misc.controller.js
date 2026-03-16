// ─── EXPENSE CONTROLLER ───────────────────────────────────────────────────────
const Expense = require('../models/Expense.model');

exports.expense = {
  create: async (req, res) => {
    try {
      const expense = await Expense.create({ ...req.body, enteredBy: req.user.id });
      res.status(201).json({ success: true, expense });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  },
  getAll: async (req, res) => {
    try {
      const { category, startDate, endDate, academicYear, page = 1, limit = 20 } = req.query;
      const query = {};
      if (category) query.category = category;
      if (academicYear) query.academicYear = academicYear;
      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate) query.date.$lte = new Date(endDate);
      }
      const total = await Expense.countDocuments(query);
      const expenses = await Expense.find(query).populate('enteredBy', 'name').sort('-date')
        .skip((page - 1) * limit).limit(Number(limit));
      const totalAmount = await Expense.aggregate([
        { $match: query }, { $group: { _id: null, sum: { $sum: '$amount' } } }
      ]);
      res.json({ success: true, expenses, total, totalAmount: totalAmount[0]?.sum || 0 });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  },
  getSummary: async (req, res) => {
    try {
      const { academicYear } = req.query;
      const match = academicYear ? { academicYear } : {};
      const summary = await Expense.aggregate([
        { $match: match },
        { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } }
      ]);
      res.json({ success: true, summary });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  },
};

// ─── CIRCULAR CONTROLLER ─────────────────────────────────────────────────────
const Circular = require('../models/Circular.model');

exports.circular = {
  create: async (req, res) => {
    try {
      const circular = await Circular.create({ ...req.body, publishedBy: req.user.id });
      res.status(201).json({ success: true, circular });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  },
  getAll: async (req, res) => {
    try {
      const { type, audience, course, page = 1, limit = 20 } = req.query;
      const query = { isPublished: true };
      if (type) query.type = type;
      if (course) query.$or = [{ course }, { course: null }];
      if (audience) query.audience = audience;
      const total = await Circular.countDocuments(query);
      const circulars = await Circular.find(query)
        .populate('course', 'name').populate('publishedBy', 'name role')
        .sort('-publishDate').skip((page - 1) * limit).limit(Number(limit));
      res.json({ success: true, circulars, total });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  },
  update: async (req, res) => {
    try {
      const circular = await Circular.findByIdAndUpdate(req.params.id, req.body, { new: true });
      res.json({ success: true, circular });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  },
  delete: async (req, res) => {
    try {
      await Circular.findByIdAndUpdate(req.params.id, { isPublished: false });
      res.json({ success: true, message: 'Circular unpublished' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  },
};

// ─── LIBRARY CONTROLLER ──────────────────────────────────────────────────────
const { Book, BookIssue } = require('../models/Library.model');

exports.library = {
  addBook: async (req, res) => {
    try {
      const book = await Book.create(req.body);
      res.status(201).json({ success: true, book });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  },
  getBooks: async (req, res) => {
    try {
      const { search, category, available } = req.query;
      const query = { isActive: true };
      if (category) query.category = category;
      if (available === 'true') query.availableCopies = { $gt: 0 };
      if (search) query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { isbn: { $regex: search, $options: 'i' } },
      ];
      const books = await Book.find(query).sort('title');
      res.json({ success: true, books });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  },
  issueBook: async (req, res) => {
    try {
      const { bookId, studentId, dueDate } = req.body;
      const book = await Book.findById(bookId);
      if (!book || book.availableCopies < 1) return res.status(400).json({ success: false, message: 'Book not available' });
      book.availableCopies -= 1;
      await book.save();
      const issue = await BookIssue.create({ book: bookId, student: studentId, dueDate, issuedBy: req.user.id });
      res.status(201).json({ success: true, issue });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  },
  returnBook: async (req, res) => {
    try {
      const issue = await BookIssue.findById(req.params.id);
      if (!issue) return res.status(404).json({ success: false, message: 'Issue record not found' });
      const returnDate = new Date();
      const dueDate = new Date(issue.dueDate);
      let fine = 0;
      if (returnDate > dueDate) {
        const overdueDays = Math.ceil((returnDate - dueDate) / (1000 * 60 * 60 * 24));
        fine = overdueDays * 5; // ₹5 per day
      }
      issue.returnDate = returnDate;
      issue.fine = fine;
      issue.status = 'returned';
      issue.returnedTo = req.user.id;
      await issue.save();
      await Book.findByIdAndUpdate(issue.book, { $inc: { availableCopies: 1 } });
      res.json({ success: true, issue, fine });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  },
  getIssues: async (req, res) => {
    try {
      const { studentId, status } = req.query;
      const query = {};
      if (studentId) query.student = studentId;
      if (status) query.status = status;
      const issues = await BookIssue.find(query)
        .populate('book', 'title author isbn')
        .populate('student', 'firstName lastName regNo')
        .sort('-issueDate');
      res.json({ success: true, issues });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  },
};

// ─── SHOP / CANTEEN CONTROLLER ───────────────────────────────────────────────
const { ShopItem, ShopSale } = require('../models/Shop.model');

exports.shop = {
  addItem: async (req, res) => {
    try {
      const item = await ShopItem.create(req.body);
      res.status(201).json({ success: true, item });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  },
  getItems: async (req, res) => {
    try {
      const { type, search } = req.query;
      const query = { isAvailable: true };
      if (type) query.type = type;
      if (search) query.name = { $regex: search, $options: 'i' };
      const items = await ShopItem.find(query).sort('name');
      res.json({ success: true, items });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  },
  createSale: async (req, res) => {
    try {
      const { studentId, type, items, paymentMode } = req.body;
      let totalAmount = 0;
      const saleItems = [];
      for (const i of items) {
        const item = await ShopItem.findById(i.itemId);
        if (!item) continue;
        const total = item.price * i.qty;
        totalAmount += total;
        item.stock -= i.qty;
        await item.save();
        saleItems.push({ item: item._id, itemName: item.name, qty: i.qty, price: item.price, total });
      }
      const sale = await ShopSale.create({
        student: studentId, type, items: saleItems, totalAmount,
        paymentMode, status: paymentMode === 'credit' ? 'credit' : 'paid',
        creditDue: paymentMode === 'credit' ? totalAmount : 0,
        operatedBy: req.user.id,
      });
      res.status(201).json({ success: true, sale });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  },
  getSales: async (req, res) => {
    try {
      const { type, startDate, endDate, studentId } = req.query;
      const query = {};
      if (type) query.type = type;
      if (studentId) query.student = studentId;
      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate) query.date.$lte = new Date(endDate);
      }
      const sales = await ShopSale.find(query)
        .populate('student', 'firstName lastName regNo')
        .sort('-date');
      const totalRevenue = sales.reduce((s, r) => s + (r.status === 'paid' ? r.totalAmount : 0), 0);
      res.json({ success: true, sales, totalRevenue });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  },
};
