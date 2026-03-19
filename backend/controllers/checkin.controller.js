import CheckIn from '../models/CheckIn.model.js';
import Student from '../models/Student.model.js';
import Course from '../models/Course.model.js';
import mongoose from 'mongoose';
import utils_notifications from '../utils/notifications.js';
const { sendSMS } = utils_notifications;

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

export const record = async (req, res) => {
  try {
    const { studentId, type, location, remarks } = req.body;
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    if (req.user.role === 'class_teacher') {
      const teacherCourseIds = await getTeacherCourseIds(req.user);
      const isAssignedStudent = teacherCourseIds.some(
        courseId => String(courseId) === String(student.course)
      );
      if (!isAssignedStudent) {
        return res.status(403).json({ success: false, message: 'Not authorized for this student' });
      }
    }

    const record = await CheckIn.create({ student: studentId, type, location, remarks, recordedBy: req.user.id });

    const msg = `${student.firstName} ${student.lastName} has ${type === 'check_in' ? 'entered' : 'exited'} ${location} at ${new Date().toLocaleTimeString()}.`;
    if (student.father?.phone) await sendSMS(student.father.phone, msg);
    if (student.mother?.phone) await sendSMS(student.mother.phone, msg);
    record.parentNotified = true;
    await record.save();

    res.status(201).json({ success: true, record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getRecords = async (req, res) => {
  try {
    const { studentId, type, location, startDate, endDate, page = 1, limit = 30 } = req.query;
    const query = {};
    if (studentId) query.student = studentId;
    if (type) query.type = type;
    if (location) query.location = location;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }
    if (req.user.role === 'class_teacher') {
      const teacherCourseIds = await getTeacherCourseIds(req.user);
      const students = await Student.find({
        course: { $in: teacherCourseIds },
      }).select('_id');
      query.student = { $in: students.map(student => student._id) };
    }
    const total = await CheckIn.countDocuments(query);
    const records = await CheckIn.find(query)
      .populate('student', 'firstName lastName regNo rollNo')
      .populate('recordedBy', 'name')
      .sort('-timestamp')
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ success: true, records, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export default {
  record,
  getRecords,
};
