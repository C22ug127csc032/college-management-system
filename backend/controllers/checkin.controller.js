import CheckIn from '../models/CheckIn.model.js';
import Student from '../models/Student.model.js';
import Course from '../models/Course.model.js';
import mongoose from 'mongoose';
import utils_notifications from '../utils/notifications.js';
import {
  createNotifications,
  getStudentNotificationRecipientIds,
} from '../utils/appNotifications.js';
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
    const normalizedType = String(type || '').trim();
    const normalizedLocation = String(location || '').trim();

    if (!['check_in', 'check_out'].includes(normalizedType)) {
      return res.status(400).json({ success: false, message: 'Invalid movement type' });
    }

    if (!['hostel', 'campus'].includes(normalizedLocation)) {
      return res.status(400).json({ success: false, message: 'Invalid movement location' });
    }

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

    const latestRecord = await CheckIn.findOne({ student: studentId }).sort('-timestamp');
    if (!latestRecord && normalizedType === 'check_out') {
      return res.status(400).json({
        success: false,
        message: 'Student must check in first before check out',
      });
    }

    if (latestRecord?.type === normalizedType) {
      const currentAction = normalizedType === 'check_in' ? 'checked in' : 'checked out';
      const nextAction = normalizedType === 'check_in' ? 'check out' : 'check in';
      return res.status(400).json({
        success: false,
        message: `Student is already ${currentAction} at ${latestRecord.location}. Please ${nextAction} next.`,
      });
    }

    if (latestRecord && latestRecord.location !== normalizedLocation) {
      const requiredAction = latestRecord.type === 'check_in' ? 'check out' : 'check in';
      return res.status(400).json({
        success: false,
        message: `Student is currently linked to ${latestRecord.location}. Please ${requiredAction} at ${latestRecord.location} first.`,
      });
    }

    const record = await CheckIn.create({
      student: studentId,
      type: normalizedType,
      location: normalizedLocation,
      remarks,
      recordedBy: req.user.id,
    });

    const formattedLocation = normalizedLocation;
    const msg = `${student.firstName} ${student.lastName} has ${normalizedType === 'check_in' ? 'checked in to' : 'checked out from'} ${formattedLocation} at ${new Date(record.timestamp).toLocaleTimeString('en-IN')}.`;

    await createNotifications({
      recipientIds: await getStudentNotificationRecipientIds(student),
      student: student._id,
      type: 'checkin',
      title: normalizedType === 'check_in' ? 'Check-in recorded' : 'Check-out recorded',
      message: msg,
      reference: String(record._id),
    });
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
    const {
      studentId,
      type,
      location,
      startDate,
      endDate,
      department,
      page = 1,
      limit = 30,
    } = req.query;
    const query = {};
    if (studentId) query.student = studentId;
    if (type) query.type = type;
    if (location) query.location = location;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const studentFilters = [];

    if (studentId) {
      studentFilters.push({ _id: studentId });
    }

    if (department?.trim()) {
      const regex = new RegExp(`^${department.trim()}$`, 'i');
      const courses = await Course.find({
        $or: [
          { department: regex },
          { name: regex },
          { code: regex },
        ],
      }).select('_id');
      studentFilters.push({ course: { $in: courses.map(course => course._id) } });
    }

    if (req.user.role === 'class_teacher') {
      const teacherCourseIds = await getTeacherCourseIds(req.user);
      studentFilters.push({ course: { $in: teacherCourseIds } });
    }

    if (studentFilters.length > 0) {
      const students = await Student.find(
        studentFilters.length === 1 ? studentFilters[0] : { $and: studentFilters }
      ).select('_id');
      query.student = { $in: students.map(student => student._id) };
    }

    const total = await CheckIn.countDocuments(query);
    const records = await CheckIn.find(query)
      .populate({
        path: 'student',
        select: 'firstName lastName regNo rollNo admissionNo className hostelRoom course',
        populate: { path: 'course', select: 'name code department' },
      })
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
