// ─── EXPENSE CONTROLLER ───────────────────────────────────────────────────────
import Expense from '../models/Expense.model.js';
import mongoose from 'mongoose';

export const expense = {
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
import Circular from '../models/Circular.model.js';
import { createNotifications, getCircularRecipientIds } from '../utils/appNotifications.js';
import Student from '../models/Student.model.js';
import Course from '../models/Course.model.js';
import { getPreferredStudentIdentifier } from '../utils/studentIdentity.js';
import StudentFees from '../models/StudentFees.model.js';
import Ledger from '../models/Ledger.model.js';

const getTeacherCourseIds = async user => {
  if (user?.role !== 'class_teacher' || !user.department) return [];

  const filters = [
    { name: user.department },
    { code: String(user.department).toUpperCase() },
  ];

  if (mongoose.Types.ObjectId.isValid(user.department)) {
    filters.unshift({ _id: user.department });
  }

  const courses = await Course.find({ $or: filters }).select('_id');
  return courses.map(course => String(course._id));
};

const normalizeCircularAudience = audience => {
  if (Array.isArray(audience)) return audience.filter(Boolean);
  if (typeof audience === 'string' && audience.trim()) return [audience.trim()];
  return [];
};

const getTeacherCircularScope = async user => {
  const teacherCourseIds = await getTeacherCourseIds(user);
  return {
    teacherCourseIds,
    defaultCourseId: teacherCourseIds[0] || null,
  };
};

export const circular = {
  create: async (req, res) => {
    try {
      const payload = { ...req.body, publishedBy: req.user.id };

      if (req.user?.role === 'class_teacher') {
        const { teacherCourseIds, defaultCourseId } = await getTeacherCircularScope(req.user);
        if (!defaultCourseId) {
          return res.status(403).json({
            success: false,
            message: 'No assigned course found for this class teacher',
          });
        }

        const requestedAudience = normalizeCircularAudience(payload.audience);
        const invalidAudience = requestedAudience.filter(value => !['students', 'parents'].includes(value));
        if (invalidAudience.length) {
          return res.status(403).json({
            success: false,
            message: 'Class teachers can publish circulars only to students and parents',
          });
        }

        if (payload.course && !teacherCourseIds.includes(String(payload.course))) {
          return res.status(403).json({
            success: false,
            message: 'Class teachers can publish only for their assigned course',
          });
        }

        payload.audience = requestedAudience.length ? requestedAudience : ['students', 'parents'];
        payload.course = payload.course || defaultCourseId;
      }

      const createdCircular = await Circular.create(payload);
      const circular = await Circular.findById(createdCircular._id)
        .populate('course', 'name')
        .populate('publishedBy', 'name role');
      await createNotifications({
        recipientIds: await getCircularRecipientIds({
          audience: circular.audience || [],
          courseId: circular.course || null,
        }),
        type: 'circular',
        title: circular.title,
        message: circular.content,
        reference: String(circular._id),
      });
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
      const existingCircular = await Circular.findById(req.params.id);
      if (!existingCircular) {
        return res.status(404).json({ success: false, message: 'Circular not found' });
      }

      const payload = { ...req.body };

      if (req.user?.role === 'class_teacher') {
        if (String(existingCircular.publishedBy) !== String(req.user.id)) {
          return res.status(403).json({
            success: false,
            message: 'Class teachers can edit only their own circulars',
          });
        }

        const { teacherCourseIds, defaultCourseId } = await getTeacherCircularScope(req.user);
        if (!defaultCourseId) {
          return res.status(403).json({
            success: false,
            message: 'No assigned course found for this class teacher',
          });
        }

        const requestedAudience = normalizeCircularAudience(
          payload.audience ?? existingCircular.audience
        );
        const invalidAudience = requestedAudience.filter(value => !['students', 'parents'].includes(value));
        if (invalidAudience.length) {
          return res.status(403).json({
            success: false,
            message: 'Class teachers can publish circulars only to students and parents',
          });
        }

        const requestedCourseId = payload.course ?? existingCircular.course;
        if (requestedCourseId && !teacherCourseIds.includes(String(requestedCourseId))) {
          return res.status(403).json({
            success: false,
            message: 'Class teachers can publish only for their assigned course',
          });
        }

        payload.audience = requestedAudience.length ? requestedAudience : ['students', 'parents'];
        payload.course = requestedCourseId || defaultCourseId;
      }

      const circular = await Circular.findByIdAndUpdate(req.params.id, payload, { new: true })
        .populate('course', 'name')
        .populate('publishedBy', 'name role');
      res.json({ success: true, circular });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  },
  delete: async (req, res) => {
    try {
      const existingCircular = await Circular.findById(req.params.id).select('publishedBy');
      if (!existingCircular) {
        return res.status(404).json({ success: false, message: 'Circular not found' });
      }

      if (
        req.user?.role === 'class_teacher' &&
        String(existingCircular.publishedBy) !== String(req.user.id)
      ) {
        return res.status(403).json({
          success: false,
          message: 'Class teachers can unpublish only their own circulars',
        });
      }

      await Circular.findByIdAndUpdate(req.params.id, { isPublished: false });
      res.json({ success: true, message: 'Circular unpublished' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  },
};

// ─── LIBRARY CONTROLLER ──────────────────────────────────────────────────────
import libraryModels from '../models/Library.model.js';
const { Book, BookIssue } = libraryModels;

const LIBRARY_FINE_HEAD = 'Library Fine';

const getNumericValue = (value, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const buildLibraryFineDescription = ({ bookTitle, dueDate, returnDate, overdueDays }) => (
  `Library fine for \"${bookTitle}\" returned ${overdueDays} day(s) late. Due ${dueDate.toLocaleDateString('en-IN')}, returned ${returnDate.toLocaleDateString('en-IN')}.`
);

const addLibraryFineToStudentFees = async ({ studentId, amount, description, academicYear, userId }) => {
  if (!amount || amount <= 0) return null;

  let studentFees = await StudentFees.findOne({
    student: studentId,
    status: { $in: ['pending', 'partial', 'overdue'] },
  }).sort({ dueDate: 1, createdAt: 1 });

  if (!studentFees) {
    studentFees = await StudentFees.findOne({ student: studentId }).sort({ createdAt: -1 });
  }

  if (!studentFees) {
    const currentYear = new Date().getFullYear();
    studentFees = new StudentFees({
      student: studentId,
      academicYear: academicYear || `${currentYear}-${currentYear + 1}`,
      feeHeads: [],
      totalAmount: 0,
      totalFine: 0,
      assignedBy: userId,
    });
  }

  const existingHead = studentFees.feeHeads.find(head => head.headName === LIBRARY_FINE_HEAD);
  if (existingHead) {
    existingHead.amount = getNumericValue(existingHead.amount) + amount;
    existingHead.due = getNumericValue(existingHead.due) + amount;
  } else {
    studentFees.feeHeads.push({
      headName: LIBRARY_FINE_HEAD,
      amount,
      paid: 0,
      due: amount,
    });
  }

  studentFees.totalFine = getNumericValue(studentFees.totalFine) + amount;
  studentFees.markModified('feeHeads');
  await studentFees.save();

  await Ledger.create({
    student: studentId,
    type: 'debit',
    category: 'fine',
    amount,
    description,
    feesRef: studentFees._id,
    academicYear: studentFees.academicYear,
    createdBy: userId,
  });

  return studentFees;
};

export const library = {
  addBook: async (req, res) => {
    try {
      const totalCopies = Math.max(1, getNumericValue(req.body.totalCopies, 1));
      const book = await Book.create({
        ...req.body,
        totalCopies,
        availableCopies: totalCopies,
      });
      res.status(201).json({ success: true, book });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  },
  updateBook: async (req, res) => {
    try {
      const existingBook = await Book.findById(req.params.id);
      if (!existingBook) return res.status(404).json({ success: false, message: 'Book not found' });

      const payload = { ...req.body };
      if (payload.totalCopies !== undefined) {
        const nextTotalCopies = Math.max(1, getNumericValue(payload.totalCopies, existingBook.totalCopies));
        const issuedCopies = Math.max(getNumericValue(existingBook.totalCopies) - getNumericValue(existingBook.availableCopies), 0);
        payload.totalCopies = nextTotalCopies;
        payload.availableCopies = Math.max(nextTotalCopies - issuedCopies, 0);
      }

      const book = await Book.findByIdAndUpdate(req.params.id, payload, { new: true });
      res.json({ success: true, book });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  },
  deactivateBook: async (req, res) => {
    try {
      await Book.findByIdAndUpdate(req.params.id, { isActive: false });
      res.json({ success: true, message: 'Book marked unavailable' });
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
  getStudents: async (req, res) => {
    try {
      const { limit = 500, search } = req.query;
      const query = { status: { $in: ['active', 'admission_pending'] } };

      if (search?.trim()) {
        const regex = new RegExp(search.trim(), 'i');
        query.$or = [
          { firstName: regex },
          { lastName: regex },
          { rollNo: regex },
          { regNo: regex },
          { admissionNo: regex },
        ];
      }

      const students = await Student.find(query)
        .select('firstName lastName rollNo regNo admissionNo')
        .sort({ firstName: 1, lastName: 1 })
        .limit(Number(limit));

      res.json({
        success: true,
        students: students.map(student => ({
          ...student.toObject(),
          studentIdentifier: getPreferredStudentIdentifier(student),
        })),
      });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  },
  issueBook: async (req, res) => {
    try {
      const { bookId, studentId, dueDate } = req.body;
      const existingIssue = await BookIssue.findOne({ book: bookId, student: studentId, status: 'issued' });
      if (existingIssue) return res.status(400).json({ success: false, message: 'This student already has this book issued' });

      const book = await Book.findOneAndUpdate(
        { _id: bookId, isActive: true, availableCopies: { $gt: 0 } },
        { $inc: { availableCopies: -1 } },
        { new: true }
      );
      if (!book) return res.status(400).json({ success: false, message: 'Book not available' });

      const issue = await BookIssue.create({ book: bookId, student: studentId, dueDate, issuedBy: req.user.id });
      res.status(201).json({ success: true, issue });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  },
  returnBook: async (req, res) => {
    try {
      const issue = await BookIssue.findById(req.params.id)
        .populate('book', 'title')
        .populate('student', 'academicYear');
      if (!issue) return res.status(404).json({ success: false, message: 'Issue record not found' });
      if (issue.status === 'returned') return res.status(400).json({ success: false, message: 'Book already returned' });

      const returnDate = new Date();
      const dueDate = new Date(issue.dueDate);
      let fine = 0;
      let overdueDays = 0;
      if (returnDate > dueDate) {
        overdueDays = Math.ceil((returnDate - dueDate) / (1000 * 60 * 60 * 24));
        fine = overdueDays * 5;
      }
      issue.returnDate = returnDate;
      issue.fine = fine;
      issue.status = 'returned';
      issue.returnedTo = req.user.id;
      await issue.save();
      await Book.findByIdAndUpdate(issue.book._id, { $inc: { availableCopies: 1 } });

      let studentFees = null;
      if (fine > 0) {
        const description = buildLibraryFineDescription({
          bookTitle: issue.book?.title || 'book',
          dueDate,
          returnDate,
          overdueDays,
        });
        studentFees = await addLibraryFineToStudentFees({
          studentId: issue.student._id,
          amount: fine,
          description,
          academicYear: issue.student?.academicYear,
          userId: req.user.id,
        });
      }

      res.json({ success: true, issue, fine, studentFeesId: studentFees?._id || null });
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
        .populate('student', 'firstName lastName rollNo regNo admissionNo')
        .sort('-issueDate');
      res.json({ success: true, issues });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  },
};

// ─── SHOP / CANTEEN CONTROLLER ───────────────────────────────────────────────
import ShopItem from '../models/ShopItem.model.js';
import Sale from '../models/Sale.model.js';

export const shop = {
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
      const sale = await Sale.create({
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
      const sales = await Sale.find(query)
        .populate('student', 'firstName lastName regNo')
        .sort('-date');
      const totalRevenue = sales.reduce((s, r) => s + (r.status === 'paid' ? r.totalAmount : 0), 0);
      res.json({ success: true, sales, totalRevenue });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  },
};

export default {
  expense,
  circular,
  library,
  shop,
};
