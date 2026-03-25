import Outpass from '../models/Outpass.model.js';
import Student from '../models/Student.model.js';
import Course from '../models/Course.model.js';
import mongoose from 'mongoose';
import utils_notifications from '../utils/notifications.js';
import {
  createNotifications,
  getCourseTeacherRecipientIds,
  getRoleRecipientIds,
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

export const createOutpass = async (req, res) => {
  try {
    const { studentId, exitDate, exitTime, expectedReturn, reason, destination } = req.body;
    const outpass = await Outpass.create({
      student: studentId, requestedBy: req.user.id,
      exitDate, exitTime, expectedReturn, reason, destination,
    });
    const student = await Student.findById(studentId).select('firstName course userRef');
    const teacherRecipients = student?.course
      ? await getCourseTeacherRecipientIds(student.course)
      : [];
    const staffRecipients = await getRoleRecipientIds(['super_admin', 'admin', 'hostel_warden']);

    await createNotifications({
      recipientIds: [...teacherRecipients, ...staffRecipients],
      student: studentId,
      type: 'outpass_status',
      title: 'New outpass request',
      message: `${student?.firstName || 'A student'} requested outpass for ${destination || 'outside visit'}.`,
      reference: String(outpass._id),
    });

    await createNotifications({
      recipientIds: await getStudentNotificationRecipientIds(student),
      student: studentId,
      type: 'outpass_status',
      title: 'Outpass request submitted',
      message: `Your outpass request for ${exitDate} is pending approval.`,
      reference: String(outpass._id),
    });
    res.status(201).json({ success: true, outpass });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getOutpasses = async (req, res) => {
  try {
    const { studentId, status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    const studentFilters = [];

    if (req.user.role === 'student') {
      const student = await Student.findOne({ userRef: req.user.id });
      if (student) query.student = student._id;
    }

    if (query.student) {
      const total = await Outpass.countDocuments(query);
      const outpasses = await Outpass.find(query)
        .populate('student', 'firstName lastName regNo rollNo phone father')
        .populate('approvedBy', 'name role')
        .sort('-createdAt')
        .skip((page - 1) * limit)
        .limit(Number(limit));
      return res.json({ success: true, outpasses, total });
    }

    if (studentId) {
      studentFilters.push({ _id: studentId });
    }

    if (req.user.role === 'class_teacher') {
      const teacherCourseIds = await getTeacherCourseIds(req.user);
      studentFilters.push({ course: { $in: teacherCourseIds } });
    }
    if (req.user.role === 'hostel_warden') {
      studentFilters.push({ isHosteler: true });
    }

    if (studentFilters.length > 0) {
      const students = await Student.find(
        studentFilters.length === 1 ? studentFilters[0] : { $and: studentFilters }
      ).select('_id');
      query.student = { $in: students.map(student => student._id) };
    }

    const total = await Outpass.countDocuments(query);
    const outpasses = await Outpass.find(query)
      .populate('student', 'firstName lastName regNo rollNo phone father')
      .populate('approvedBy', 'name role')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ success: true, outpasses, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateOutpassStatus = async (req, res) => {
  try {
    const { status, remarks } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid outpass status update' });
    }
    const existingOutpass = await Outpass.findById(req.params.id).populate('student', 'course isHosteler');
    if (!existingOutpass) return res.status(404).json({ success: false, message: 'Outpass not found' });

    if (req.user.role === 'class_teacher') {
      const teacherCourseIds = await getTeacherCourseIds(req.user);
      const isAssignedStudent = teacherCourseIds.some(
        courseId => String(courseId) === String(existingOutpass.student?.course)
      );
      if (!isAssignedStudent) {
        return res.status(403).json({ success: false, message: 'Not authorized for this student outpass' });
      }
    }

    if (req.user.role === 'hostel_warden' && !existingOutpass.student?.isHosteler) {
      return res.status(403).json({
        success: false,
        message: 'Hostel warden can manage outpass only for hostel students',
      });
    }

    if (existingOutpass.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Outpass is already ${existingOutpass.status}` });
    }

    const outpass = await Outpass.findByIdAndUpdate(req.params.id, {
      status, remarks, approvedBy: req.user.id, approvedAt: new Date()
    }, { new: true }).populate('student', 'firstName lastName phone father');

    const student = outpass.student;
    const msg = `Outpass request ${status} for exit on ${outpass.exitDate?.toDateString()}. ${remarks ? 'Remarks: ' + remarks : ''}`;
    await createNotifications({
      recipientIds: await getStudentNotificationRecipientIds(student),
      student: student?._id,
      type: 'outpass_status',
      title: `Outpass ${status}`,
      message: msg,
      reference: String(outpass._id),
    });
    if (student?.phone) await sendSMS(student.phone, msg);
    if (student?.father?.phone) await sendSMS(student.father.phone, msg);
    outpass.parentNotified = true;
    await outpass.save();

    res.json({ success: true, outpass });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const markReturned = async (req, res) => {
  try {
    const existingOutpass = await Outpass.findById(req.params.id).populate('student', 'course isHosteler');
    if (!existingOutpass) return res.status(404).json({ success: false, message: 'Outpass not found' });

    if (req.user.role === 'class_teacher') {
      const teacherCourseIds = await getTeacherCourseIds(req.user);
      const isAssignedStudent = teacherCourseIds.some(
        courseId => String(courseId) === String(existingOutpass.student?.course)
      );
      if (!isAssignedStudent) {
        return res.status(403).json({ success: false, message: 'Not authorized for this student outpass' });
      }
    }

    if (req.user.role === 'hostel_warden' && !existingOutpass.student?.isHosteler) {
      return res.status(403).json({
        success: false,
        message: 'Hostel warden can manage outpass only for hostel students',
      });
    }

    if (existingOutpass.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'Only approved outpass can be marked returned' });
    }

    const outpass = await Outpass.findByIdAndUpdate(req.params.id, {
      status: 'returned', actualReturn: new Date()
    }, { new: true }).populate('student', 'firstName lastName phone father');

    const student = outpass.student;
    const msg = `Student ${student?.firstName} has returned to hostel on ${new Date().toLocaleString()}.`;
    await createNotifications({
      recipientIds: await getStudentNotificationRecipientIds(student),
      student: student?._id,
      type: 'outpass_status',
      title: 'Outpass closed',
      message: msg,
      reference: String(outpass._id),
    });
    if (student?.father?.phone) await sendSMS(student.father.phone, msg);

    res.json({ success: true, outpass });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export default {
  createOutpass,
  getOutpasses,
  updateOutpassStatus,
  markReturned,
};
