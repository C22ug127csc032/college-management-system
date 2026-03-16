import Student from '../models/Student.model.js';
import User from '../models/User.model.js';
import Ledger from '../models/Ledger.model.js';
import utils_notifications from '../utils/notifications.js';
const { sendSMS, sendEmail } = utils_notifications;
import multer from 'multer';
import path from 'path';

// @GET /api/students
export const getAllStudents = async (req, res) => {
  try {
    const { course, status, search, academicYear, page = 1, limit = 20 } = req.query;
    const query = {};
    if (course) query.course = course;
    if (status) query.status = status;
    if (academicYear) query.academicYear = academicYear;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName:  { $regex: search, $options: 'i' } },
        { regNo:     { $regex: search, $options: 'i' } },
        { phone:     { $regex: search, $options: 'i' } },
      ];
    }
    const total = await Student.countDocuments(query);
    const students = await Student.find(query)
      .populate('course', 'name code')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ success: true, students, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/students/:id
export const getStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate('course', 'name code department');
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, student });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/students
export const createStudent = async (req, res) => {
  try {
    const data = req.body;
    if (req.file) data.photo = `/uploads/${req.file.filename}`;

    const student = await Student.create(data);

    // Create user account for student login
    const userPass = data.phone; // default password = phone number
    const user = await User.create({
      name: `${data.firstName} ${data.lastName}`,
      phone: data.phone,
      email: data.email,
      password: userPass,
      role: 'student',
      studentRef: student._id,
    });
    student.userRef = user._id;
    await student.save();

    // Welcome SMS
    await sendSMS(data.phone, `Welcome to College! Your Student ID: ${student.regNo}. Login with your phone number. Password: ${data.phone}`);

    res.status(201).json({ success: true, message: 'Student created', student });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @PUT /api/students/:id
export const updateStudent = async (req, res) => {
  try {
    const data = req.body;
    if (req.file) data.photo = `/uploads/${req.file.filename}`;
    const student = await Student.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true })
      .populate('course', 'name code');
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, student });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @DELETE /api/students/:id
export const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, { status: 'inactive' }, { new: true });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, message: 'Student deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/students/:id/ledger
export const getStudentLedger = async (req, res) => {
  try {
    const { startDate, endDate, category, page = 1, limit = 30 } = req.query;
    const query = { student: req.params.id };
    if (category) query.category = category;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    const total = await Ledger.countDocuments(query);
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

// @GET /api/students/reg/:regNo
export const getStudentByRegNo = async (req, res) => {
  try {
    const student = await Student.findOne({ regNo: req.params.regNo }).populate('course', 'name code');
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, student });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/students/stats/summary
export const getStudentStats = async (req, res) => {
  try {
    const total = await Student.countDocuments();
    const active = await Student.countDocuments({ status: 'active' });
    const hostel = await Student.countDocuments({ isHosteler: true });
    const newThisMonth = await Student.countDocuments({
      createdAt: { $gte: new Date(new Date().setDate(1)) }
    });
    res.json({ success: true, stats: { total, active, hostel, newThisMonth } });
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
  getStudentStats,
};
