const FeesStructure = require('../models/FeesStructure.model');
const StudentFees = require('../models/StudentFees.model');
const Student = require('../models/Student.model');
const Ledger = require('../models/Ledger.model');

// ─── Fee Structure CRUD ────────────────────────────────────────────────────────

exports.createStructure = async (req, res) => {
  try {
    const structure = await FeesStructure.create({ ...req.body, createdBy: req.user.id });
    res.status(201).json({ success: true, structure });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAllStructures = async (req, res) => {
  try {
    const { course, academicYear } = req.query;
    const query = {};
    if (course) query.course = course;
    if (academicYear) query.academicYear = academicYear;
    const structures = await FeesStructure.find(query).populate('course', 'name code').sort('-createdAt');
    res.json({ success: true, structures });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getStructure = async (req, res) => {
  try {
    const structure = await FeesStructure.findById(req.params.id).populate('course', 'name code');
    if (!structure) return res.status(404).json({ success: false, message: 'Structure not found' });
    res.json({ success: true, structure });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateStructure = async (req, res) => {
  try {
    const structure = await FeesStructure.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, structure });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Assign Fees to Student ───────────────────────────────────────────────────

exports.assignFees = async (req, res) => {
  try {
    const { studentId, structureId, academicYear, semester, dueDate } = req.body;
    const structure = await FeesStructure.findById(structureId);
    if (!structure) return res.status(404).json({ success: false, message: 'Structure not found' });

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    // Adjust advance if any
    const advance = student.advanceAmount || 0;

    const feeHeads = structure.feeHeads.map(h => ({
      headName: h.headName, amount: h.amount, paid: 0, due: h.amount
    }));

    const sf = await StudentFees.create({
      student: studentId,
      structure: structureId,
      academicYear,
      semester,
      feeHeads,
      totalAmount: structure.totalAmount,
      dueDate: dueDate || (structure.installments[0]?.dueDate),
      advanceAdjusted: advance,
      assignedBy: req.user.id,
    });

    // Create ledger debit entry
    await Ledger.create({
      student: studentId,
      type: 'debit',
      category: 'fee_billed',
      amount: structure.totalAmount,
      description: `Fees billed for ${academicYear} Sem ${semester}`,
      feesRef: sf._id,
      academicYear,
      createdBy: req.user.id,
    });

    if (advance > 0) {
      await Ledger.create({
        student: studentId,
        type: 'credit',
        category: 'advance',
        amount: advance,
        description: `Advance payment adjusted`,
        feesRef: sf._id,
        academicYear,
        createdBy: req.user.id,
      });
      student.advanceAmount = 0;
      student.advanceAdjusted = true;
      await student.save();
    }

    res.status(201).json({ success: true, studentFees: sf });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Get Student Fees ─────────────────────────────────────────────────────────

exports.getStudentFees = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { academicYear, status } = req.query;
    const query = { student: studentId };
    if (academicYear) query.academicYear = academicYear;
    if (status) query.status = status;
    const fees = await StudentFees.find(query)
      .populate('structure', 'name feeHeads installments fineEnabled')
      .sort('-createdAt');
    res.json({ success: true, fees });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Fees Dashboard Summary ───────────────────────────────────────────────────

exports.getFeesSummary = async (req, res) => {
  try {
    const { academicYear } = req.query;
    const query = academicYear ? { academicYear } : {};
    const [totalBilled, totalCollected, totalDue, overdueCount] = await Promise.all([
      StudentFees.aggregate([{ $match: query }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
      StudentFees.aggregate([{ $match: query }, { $group: { _id: null, total: { $sum: '$totalPaid' } } }]),
      StudentFees.aggregate([{ $match: query }, { $group: { _id: null, total: { $sum: '$totalDue' } } }]),
      StudentFees.countDocuments({ ...query, status: 'overdue' }),
    ]);
    res.json({
      success: true,
      summary: {
        totalBilled: totalBilled[0]?.total || 0,
        totalCollected: totalCollected[0]?.total || 0,
        totalDue: totalDue[0]?.total || 0,
        overdueCount,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── All Student Fees (with filter) ──────────────────────────────────────────

exports.getAllStudentFees = async (req, res) => {
  try {
    const { academicYear, status, course, page = 1, limit = 20 } = req.query;
    const query = {};
    if (academicYear) query.academicYear = academicYear;
    if (status) query.status = status;

    let studentIds;
    if (course) {
      const students = await Student.find({ course }).select('_id');
      studentIds = students.map(s => s._id);
      query.student = { $in: studentIds };
    }

    const total = await StudentFees.countDocuments(query);
    const fees = await StudentFees.find(query)
      .populate({ path: 'student', select: 'firstName lastName regNo phone course', populate: { path: 'course', select: 'name' } })
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, fees, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
