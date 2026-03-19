import Student from '../models/Student.model.js';
import User    from '../models/User.model.js';
import Ledger  from '../models/Ledger.model.js';
import Course  from '../models/Course.model.js';
import mongoose from 'mongoose';
import utils_notifications from '../utils/notifications.js';
const { sendSMS } = utils_notifications;

// ── Helpers ───────────────────────────────────────────────────────────────────

const parseMaybeJson = value => {
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); } catch { return value; }
};

const normalizeStudentPayload = body => {
  const data = { ...body };
  ['address', 'father', 'mother', 'guardian'].forEach(key => {
    if (key in data) data[key] = parseMaybeJson(data[key]);
  });
  if ('isHosteler' in data) {
    data.isHosteler = data.isHosteler === true || data.isHosteler === 'true';
  }
  if ('semester' in data && data.semester !== '') {
    data.semester = Number(data.semester);
  }
  if (data.father)   delete data.father.email;
  if (data.mother)   delete data.mother.email;
  if (data.guardian) delete data.guardian.email;
  return data;
};

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
  return courses.map(course => course._id);
};

// ── Generate Admission No — ADM2024001 format ─────────────────────────────────
const generateAdmissionNo = async () => {
  const year = new Date().getFullYear();
  const latest = await Student.findOne({
    admissionNo: { $regex: `^ADM${year}` },
  })
    .sort({ admissionNo: -1 })
    .select('admissionNo');

  let nextSeq = 1;
  if (latest?.admissionNo) {
    const seq = parseInt(latest.admissionNo.replace(`ADM${year}`, ''), 10);
    if (!isNaN(seq)) nextSeq = seq + 1;
  }
  return `ADM${year}${String(nextSeq).padStart(3, '0')}`;
};

// ── Generate Temp Reg No ──────────────────────────────────────────────────────
const generateTempRegNo = async () => {
  const count = await Student.countDocuments();
  const year  = new Date().getFullYear().toString().slice(-2);
  return `TEMP${year}${String(count + 1).padStart(6, '0')}`;
};

// ── Generate Sequential Reg No ────────────────────────────────────────────────
const generateNextRegNo = async () => {
  const latest = await Student.findOne({ regNo: /^REG\d+$/ })
    .sort({ createdAt: -1 })
    .select('regNo');
  const latestNumber = latest?.regNo
    ? Number(latest.regNo.replace(/^REG/, ''))
    : 0;
  return `REG${String(latestNumber + 1).padStart(10, '0')}`;
};

// ── Check class strength ──────────────────────────────────────────────────────
const checkClassStrength = async (courseId, className) => {
  if (!className || !courseId) return { full: false, count: 0, max: 60 };
  const course = await Course.findById(courseId);
  const max    = course?.maxStrength || 60;
  const count  = await Student.countDocuments({
    className,
    status: { $in: ['active', 'admission_pending'] },
  });
  return {
    full:       count >= max,
    count,
    max,
    remaining:  max - count,
    percentage: Math.round((count / max) * 100),
  };
};

// ── GET /api/students ─────────────────────────────────────────────────────────
export const getAllStudents = async (req, res) => {
  try {
    const {
      course, status, search,
      academicYear, className,
      page = 1, limit = 20,
    } = req.query;

    const query = {};
    const teacherCourseIds = await getTeacherCourseIds(req.user);

    if (req.user?.role === 'class_teacher') {
      if (!teacherCourseIds.length) {
        return res.json({
          success: true,
          students: [],
          total: 0,
          page: Number(page),
          pages: 0,
        });
      }
      query.course = { $in: teacherCourseIds };
    }

    if (course)       query.course       = course;
    if (status)       query.status       = status;
    if (academicYear) query.academicYear = academicYear;
    if (className)    query.className    = className;

    if (req.user?.role === 'class_teacher') {
      query.course = { $in: teacherCourseIds };
    }
    if (search) {
      query.$or = [
        { firstName:   { $regex: search, $options: 'i' } },
        { lastName:    { $regex: search, $options: 'i' } },
        { regNo:       { $regex: search, $options: 'i' } },
        { admissionNo: { $regex: search, $options: 'i' } },
        { phone:       { $regex: search, $options: 'i' } },
      ];
    }

    const total    = await Student.countDocuments(query);
    const students = await Student.find(query)
      .populate('course', 'name code')
      .sort('className firstName')
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      students,
      total,
      page:  Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/students/:id ─────────────────────────────────────────────────────
export const getStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('course', 'name code department');
    if (!student)
      return res.status(404).json({ success: false, message: 'Student not found' });

    if (req.user?.role === 'class_teacher') {
      const teacherCourseIds = await getTeacherCourseIds(req.user);
      const isAssignedStudent = teacherCourseIds.some(
        courseId => String(courseId) === String(student.course?._id || student.course)
      );

      if (!isAssignedStudent) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view this student',
        });
      }
    }

    res.json({ success: true, student });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/students ────────────────────────────────────────────────────────
export const createStudent = async (req, res) => {
  try {
    const data = normalizeStudentPayload(req.body);
    if (req.file) data.photo = `/uploads/${req.file.filename}`;
    data.email = data.email || undefined;

    // Check phone already exists
    const existingUser = await User.findOne({ phone: data.phone });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Phone number already registered',
      });
    }

    // ── Class strength check ──────────────────────────────────────────────
    if (data.className && data.course) {
      const strength = await checkClassStrength(data.course, data.className);
      if (strength.full) {
        return res.status(400).json({
          success: false,
          message: `Class ${data.className} is full (${strength.count}/${strength.max} students). Please assign Section B.`,
          classInfo: strength,
        });
      }
    }

    // ── Auto generate Admission No — always on day 1 ──────────────────────
    if (!data.admissionNo || data.admissionNo.trim() === '') {
      data.admissionNo = await generateAdmissionNo();
    }

    // ── Reg No — empty until university assigns ───────────────────────────
    if (!data.regNo || data.regNo.trim() === '') {
      delete data.regNo;
      data.status = 'admission_pending';
    } else {
      data.status = data.status || 'active';
    }

    const student = await Student.create(data);

    // ── Create student login account ──────────────────────────────────────
    // Default password = admissionNo (NOT phone number anymore)
    // isFirstLogin = true → forces student to change password on first login
    try {
      const user = await User.create({
        name:         `${data.firstName} ${data.lastName}`,
        phone:        data.phone,
        email:        data.email,
        password:     student.admissionNo,  // ← admissionNo as default password
        role:         'student',
        studentRef:   student._id,
        isFirstLogin: true,                 // ← force password change
      });
      student.userRef = user._id;
      await student.save();
    } catch (userErr) {
      // Rollback student if user creation fails
      await Student.findByIdAndDelete(student._id);
      throw userErr;
    }

    // ── Welcome SMS with admission credentials ────────────────────────────
    try {
      await sendSMS(
        data.phone,
        `Welcome to College! \n` +
        `Admission No: ${student.admissionNo}\n` +
        `Login at Student Portal:\n` +
        `Phone: ${data.phone}\n` +
        `Password: ${student.admissionNo}\n` +
        `You will be asked to set a new password on first login.`
      );
    } catch {
      // SMS failure should not block student creation
    }

    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      student,
    });
  } catch (err) {
    const status = err.code === 11000 ? 409 : 500;
    res.status(status).json({ success: false, message: err.message });
  }
};

// ── PUT /api/students/:id ─────────────────────────────────────────────────────
export const updateStudent = async (req, res) => {
  try {
    const data = normalizeStudentPayload(req.body);
    if (req.file) data.photo = `/uploads/${req.file.filename}`;
    data.email = data.email || undefined;

    const existing = await Student.findById(req.params.id)
      .select('userRef regNo admissionNo status className');
    if (!existing)
      return res.status(404).json({ success: false, message: 'Student not found' });

    // Protect admissionNo — never overwrite existing one
    if (existing.admissionNo) {
      delete data.admissionNo;
    }

    // Class strength check on update
    if (
      data.className &&
      data.course &&
      data.className !== existing.className
    ) {
      const strength = await checkClassStrength(data.course, data.className);
      if (strength.full) {
        return res.status(400).json({
          success: false,
          message: `Class ${data.className} is full (${strength.count}/${strength.max} students). Please assign Section B.`,
          classInfo: strength,
        });
      }
    }

    // Handle regNo update
    if ('regNo' in data && (!data.regNo || data.regNo.trim() === '')) {
      delete data.regNo;
      if (!existing.regNo) data.status = 'admission_pending';
    }

    // Activate student when reg no assigned
    if (!existing.regNo && data.regNo && data.regNo.trim() !== '') {
      data.status = 'active';
    }

    const student = await Student.findByIdAndUpdate(
      req.params.id, data, { new: true, runValidators: true }
    ).populate('course', 'name code');

    if (!student)
      return res.status(404).json({ success: false, message: 'Student not found' });

    // Update user account name/phone if changed
    if (student.userRef) {
      await User.findByIdAndUpdate(student.userRef, {
        name:  `${student.firstName} ${student.lastName}`,
        phone: student.phone,
        email: student.email,
      });
    }

    res.json({ success: true, student });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE /api/students/:id ──────────────────────────────────────────────────
export const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { status: 'inactive' },
      { new: true }
    );
    if (!student)
      return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, message: 'Student deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/students/:id/ledger ──────────────────────────────────────────────
export const getStudentLedger = async (req, res) => {
  try {
    const { startDate, endDate, category, page = 1, limit = 30 } = req.query;
    const query = { student: req.params.id };
    if (category) query.category = category;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate)   query.date.$lte = new Date(endDate);
    }
    const total   = await Ledger.countDocuments(query);
    const entries = await Ledger.find(query)
      .sort('-date')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('paymentRef', 'receiptNo paymentDate');
    res.json({ success: true, entries, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/students/reg/:regNo ──────────────────────────────────────────────
export const getStudentByRegNo = async (req, res) => {
  try {
    const student = await Student.findOne({ regNo: req.params.regNo })
      .populate('course', 'name code');
    if (!student)
      return res.status(404).json({ success: false, message: 'Student not found' });

    if (req.user?.role === 'class_teacher') {
      const teacherCourseIds = await getTeacherCourseIds(req.user);
      const isAssignedStudent = teacherCourseIds.some(
        courseId => String(courseId) === String(student.course?._id || student.course)
      );
      if (!isAssignedStudent) {
        return res.status(404).json({ success: false, message: 'Student not found' });
      }
    }

    res.json({ success: true, student });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/students/adm/:admissionNo ────────────────────────────────────────
export const getStudentByAdmissionNo = async (req, res) => {
  try {
    const student = await Student.findOne({
      admissionNo: req.params.admissionNo,
    }).populate('course', 'name code');
    if (!student)
      return res.status(404).json({ success: false, message: 'Student not found' });

    if (req.user?.role === 'class_teacher') {
      const teacherCourseIds = await getTeacherCourseIds(req.user);
      const isAssignedStudent = teacherCourseIds.some(
        courseId => String(courseId) === String(student.course?._id || student.course)
      );
      if (!isAssignedStudent) {
        return res.status(404).json({ success: false, message: 'Student not found' });
      }
    }

    res.json({ success: true, student });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/students/stats/summary ──────────────────────────────────────────
export const getStudentStats = async (req, res) => {
  try {
    const teacherCourseIds = await getTeacherCourseIds(req.user);
    const courseScope = req.user?.role === 'class_teacher'
      ? { course: { $in: teacherCourseIds } }
      : {};

    const [total, active, hostel, pending, newThisMonth] = await Promise.all([
      Student.countDocuments(courseScope),
      Student.countDocuments({ ...courseScope, status: 'active' }),
      Student.countDocuments({ ...courseScope, isHosteler: true }),
      Student.countDocuments({ ...courseScope, status: 'admission_pending' }),
      Student.countDocuments({
        ...courseScope,
        createdAt: { $gte: new Date(new Date().setDate(1)) },
      }),
    ]);
    res.json({
      success: true,
      stats: { total, active, hostel, pending, newThisMonth },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/students/class-strength/:className ───────────────────────────────
export const getClassStrength = async (req, res) => {
  try {
    const { className } = req.params;
    const { courseId }  = req.query;
    const course = courseId ? await Course.findById(courseId) : null;
    const max    = course?.maxStrength || 60;
    const count  = await Student.countDocuments({
      className,
      status: { $in: ['active', 'admission_pending'] },
    });
    res.json({
      success:    true,
      className,
      count,
      max,
      remaining:  max - count,
      full:       count >= max,
      percentage: Math.round((count / max) * 100),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/students/promote ────────────────────────────────────────────────
export const promoteClass = async (req, res) => {
  try {
    const { className, courseId } = req.body;
    if (!className) {
      return res.status(400).json({
        success: false, message: 'className is required',
      });
    }
    const students = await Student.find({
      className,
      status: { $in: ['active', 'admission_pending'] },
    });
    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No active students found in class ${className}`,
      });
    }
    const course    = courseId ? await Course.findById(courseId) : null;
    const maxSem    = course?.semesters || 6;
    const promoted  = [];
    const graduated = [];
    const skipped   = [];

    for (const student of students) {
      const currentSem = student.semester || 1;
      if (currentSem >= maxSem) {
        await Student.findByIdAndUpdate(student._id, {
          status: 'graduated', semester: currentSem,
        });
        graduated.push(`${student.firstName} ${student.lastName}`);
      } else {
        await Student.findByIdAndUpdate(student._id, {
          semester: currentSem + 1, status: 'active',
        });
        promoted.push(`${student.firstName} ${student.lastName}`);
      }
    }
    res.json({
      success: true,
      message: `Promotion complete for ${className}`,
      summary: {
        total: students.length, promoted: promoted.length,
        graduated: graduated.length, skipped: skipped.length,
      },
      promoted, graduated,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/students/promote-single ─────────────────────────────────────────
export const promoteSingle = async (req, res) => {
  try {
    const { studentId } = req.body;
    const student = await Student.findById(studentId)
      .populate('course', 'semesters');
    if (!student) {
      return res.status(404).json({
        success: false, message: 'Student not found',
      });
    }
    const maxSem     = student.course?.semesters || 6;
    const currentSem = student.semester || 1;
    if (currentSem >= maxSem) {
      await Student.findByIdAndUpdate(studentId, { status: 'graduated' });
      return res.json({
        success: true,
        message: `${student.firstName} ${student.lastName} has been graduated`,
        action:  'graduated',
      });
    }
    const updated = await Student.findByIdAndUpdate(
      studentId,
      { semester: currentSem + 1, status: 'active' },
      { new: true }
    ).populate('course', 'name code semesters');
    res.json({
      success: true,
      message: `${student.firstName} promoted to Semester ${currentSem + 1}`,
      action:  'promoted',
      student: updated,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export default {
  getAllStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentLedger,
  getStudentByRegNo,
  getStudentByAdmissionNo,
  getStudentStats,
  getClassStrength,
  promoteClass,
  promoteSingle,
};
