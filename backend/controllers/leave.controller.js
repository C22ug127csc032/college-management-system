import Leave from '../models/Leave.model.js';
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
const { sendSMS, sendEmail } = utils_notifications;

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

export const applyLeave = async (req, res) => {
  try {
    const { studentId, leaveType, fromDate, toDate, reason } = req.body;
    const leave = await Leave.create({
      student: studentId,
      appliedBy: req.user.id,
      appliedByRole: req.user.role === 'student' ? 'student' : 'parent',
      leaveType, fromDate, toDate, reason,
    });
    const student = await Student.findById(studentId);
    const teacherRecipients = student?.course
      ? await getCourseTeacherRecipientIds(student.course)
      : [];
    const adminRecipients = await getRoleRecipientIds(['super_admin', 'admin']);

    await createNotifications({
      recipientIds: [...teacherRecipients, ...adminRecipients],
      student: studentId,
      type: 'leave_status',
      title: 'New leave request',
      message: `${student?.firstName || 'A student'} requested leave from ${fromDate} to ${toDate}.`,
      reference: String(leave._id),
    });

    await createNotifications({
      recipientIds: await getStudentNotificationRecipientIds(student),
      student: studentId,
      type: 'leave_status',
      title: 'Leave request submitted',
      message: `Your leave request from ${fromDate} to ${toDate} is pending approval.`,
      reference: String(leave._id),
    });

    if (student?.phone)
      await sendSMS(student.phone, `Leave application submitted for ${fromDate} to ${toDate}. Status: Pending.`);
    res.status(201).json({ success: true, leave });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getLeaves = async (req, res) => {
  try {
    const { studentId, status, startDate, endDate, page = 1, limit = 20 } = req.query;
    const query = {};
    if (studentId) query.student = studentId;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.fromDate = {};
      if (startDate) query.fromDate.$gte = new Date(startDate);
      if (endDate) query.fromDate.$lte = new Date(endDate);
    }
    // If student role - only their own
    if (req.user.role === 'student') {
      const student = await Student.findOne({ userRef: req.user.id });
      if (student) query.student = student._id;
    }
    if (req.user.role === 'class_teacher') {
      const teacherCourseIds = await getTeacherCourseIds(req.user);
      const students = await Student.find({
        course: { $in: teacherCourseIds },
      }).select('_id');
      query.student = { $in: students.map(student => student._id) };
    }
    const total = await Leave.countDocuments(query);
    const leaves = await Leave.find(query)
      .populate('student', 'firstName lastName regNo rollNo phone')
      .populate('approvedBy', 'name role')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ success: true, leaves, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateLeaveStatus = async (req, res) => {
  try {
    const { status, remarks } = req.body;
    const existingLeave = await Leave.findById(req.params.id).populate('student', 'course');
    if (!existingLeave) return res.status(404).json({ success: false, message: 'Leave not found' });

    if (req.user.role === 'class_teacher') {
      const teacherCourseIds = await getTeacherCourseIds(req.user);
      const isAssignedStudent = teacherCourseIds.some(
        courseId => String(courseId) === String(existingLeave.student?.course)
      );
      if (!isAssignedStudent) {
        return res.status(403).json({ success: false, message: 'Not authorized for this student leave' });
      }
    }

    const leave = await Leave.findByIdAndUpdate(req.params.id, {
      status, remarks, approvedBy: req.user.id, approvedAt: new Date()
    }, { new: true }).populate('student', 'firstName lastName phone father');

    const student = leave.student;
    const msg = `Leave request ${status}. ${remarks ? 'Remarks: ' + remarks : ''}`;
    await createNotifications({
      recipientIds: await getStudentNotificationRecipientIds(student),
      student: student?._id,
      type: 'leave_status',
      title: `Leave ${status}`,
      message: remarks ? `${msg}` : `Your leave request has been ${status}.`,
      reference: String(leave._id),
    });
    if (student?.phone) await sendSMS(student.phone, msg);
    if (student?.father?.phone) await sendSMS(student.father.phone, msg);
    res.json({ success: true, leave });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id)
      .populate('student', 'firstName lastName regNo rollNo phone course')
      .populate('approvedBy', 'name');
    if (!leave) return res.status(404).json({ success: false, message: 'Leave not found' });

    if (req.user.role === 'class_teacher') {
      const teacherCourseIds = await getTeacherCourseIds(req.user);
      const isAssignedStudent = teacherCourseIds.some(
        courseId => String(courseId) === String(leave.student?.course)
      );
      if (!isAssignedStudent) {
        return res.status(403).json({ success: false, message: 'Not authorized for this student leave' });
      }
    }

    res.json({ success: true, leave });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export default {
  applyLeave,
  getLeaves,
  updateLeaveStatus,
  getLeave,
};
