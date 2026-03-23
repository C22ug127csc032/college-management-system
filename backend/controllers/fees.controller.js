import FeesStructure from '../models/FeesStructure.model.js';
import StudentFees from '../models/StudentFees.model.js';
import Student from '../models/Student.model.js';
import Ledger from '../models/Ledger.model.js';

// ─── Fee Structure CRUD ────────────────────────────────────────────────────────

export const createStructure = async (req, res) => {
  try {
    const structure = await FeesStructure.create({ ...req.body, createdBy: req.user.id });
    res.status(201).json({ success: true, structure });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getAllStructures = async (req, res) => {
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

export const getStructure = async (req, res) => {
  try {
    const structure = await FeesStructure.findById(req.params.id).populate('course', 'name code');
    if (!structure) return res.status(404).json({ success: false, message: 'Structure not found' });
    res.json({ success: true, structure });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateStructure = async (req, res) => {
  try {
    const structure = await FeesStructure.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, structure });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Assign Fees to Student ───────────────────────────────────────────────────

export const assignFees = async (req, res) => {
  try {
    const { studentId, structureId, academicYear, semester, dueDate } = req.body;
    const structure = await FeesStructure.findById(structureId);
    if (!structure) return res.status(404).json({ success: false, message: 'Structure not found' });

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    if (structure.course && String(structure.course) !== String(student.course)) {
      return res.status(400).json({ success: false, message: 'Selected fee structure does not match the student course' });
    }

    const resolvedAcademicYear = academicYear || structure.academicYear || student.academicYear;
    const resolvedSemester = Number(semester || structure.semester || student.semester || 0) || undefined;

    const existingAssignment = await StudentFees.findOne({
      student: studentId,
      academicYear: resolvedAcademicYear,
      ...(resolvedSemester ? { semester: resolvedSemester } : {}),
    });

    if (existingAssignment) {
      return res.status(409).json({
        success: false,
        message: `Fees already assigned for ${resolvedAcademicYear}${resolvedSemester ? ` semester ${resolvedSemester}` : ''}`,
      });
    }

    // Adjust advance if any
    const advance = student.advanceAmount || 0;

    const feeHeads = structure.feeHeads.map(h => ({
      headName: h.headName, amount: h.amount, paid: 0, due: h.amount
    }));

    const sf = await StudentFees.create({
      student: studentId,
      structure: structureId,
      academicYear: resolvedAcademicYear,
      semester: resolvedSemester,
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
      description: `Fees billed for ${resolvedAcademicYear}${resolvedSemester ? ` Sem ${resolvedSemester}` : ''}`,
      feesRef: sf._id,
      academicYear: resolvedAcademicYear,
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
        academicYear: resolvedAcademicYear,
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

export const getStudentFees = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { academicYear, status } = req.query;
    const query = { student: studentId };
    if (academicYear?.trim()) query.academicYear = { $regex: academicYear.trim(), $options: 'i' };
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

export const getFeesSummary = async (req, res) => {
  try {
    const { academicYear } = req.query;
    const query = academicYear?.trim()
      ? { academicYear: { $regex: academicYear.trim(), $options: 'i' } }
      : {};
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

export const getAllStudentFees = async (req, res) => {
  try {
    const { academicYear, status, course, page = 1, limit = 20 } = req.query;
    const query = {};
    if (academicYear?.trim()) query.academicYear = { $regex: academicYear.trim(), $options: 'i' };
    if (status) query.status = status;

    let studentIds;
    if (course) {
      const students = await Student.find({ course }).select('_id');
      studentIds = students.map(s => s._id);
      query.student = { $in: studentIds };
    }

    const total = await StudentFees.countDocuments(query);
    const fees = await StudentFees.find(query)
      .populate({ path: 'student', select: 'firstName lastName regNo phone course', populate: { path: 'course', select: 'name department code' } })
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, fees, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export default {
  createStructure,
  getAllStructures,
  getStructure,
  updateStructure,
  assignFees,
  getStudentFees,
  getFeesSummary,
  getAllStudentFees,
};
