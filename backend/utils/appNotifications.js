import Notification from '../models/Notification.model.js';
import User from '../models/User.model.js';
import Course from '../models/Course.model.js';
import Student from '../models/Student.model.js';

const uniqIds = ids => [...new Set(ids.filter(Boolean).map(String))];

export const createNotifications = async ({ recipientIds = [], ...payload }) => {
  const uniqueRecipientIds = uniqIds(recipientIds);
  if (!uniqueRecipientIds.length) return [];

  const docs = uniqueRecipientIds.map(recipient => ({
    recipient,
    channels: ['app'],
    ...payload,
  }));

  return Notification.insertMany(docs, { ordered: false });
};

export const getStudentNotificationRecipientIds = async studentInput => {
  const student =
    typeof studentInput === 'object' && studentInput?._id
      ? studentInput
      : await Student.findById(studentInput).select('_id userRef');

  if (!student?._id) return [];

  const parentUsers = await User.find({
    studentRef: student._id,
    role: 'parent',
  }).select('_id');

  return uniqIds([
    student.userRef,
    ...parentUsers.map(user => user._id),
  ]);
};

export const getCourseTeacherRecipientIds = async courseId => {
  if (!courseId) return [];

  const course = await Course.findById(courseId).select('classTeacher name code');
  if (!course) return [];

  const teachers = await User.find({
    role: 'class_teacher',
    $or: [
      { department: String(course._id) },
      { department: course.name },
      { department: course.code },
    ],
  }).select('_id');

  return uniqIds([
    course.classTeacher,
    ...teachers.map(user => user._id),
  ]);
};

export const getRoleRecipientIds = async roles => {
  const users = await User.find({ role: { $in: roles } }).select('_id');
  return uniqIds(users.map(user => user._id));
};

export const getCircularRecipientIds = async ({ audience = [], courseId = null }) => {
  const normalizedAudience = audience.includes('all')
    ? ['students', 'parents', 'staff']
    : audience;

  const recipients = [];
  let courseQuery = {};

  if (courseId) {
    courseQuery = { course: courseId };
  }

  if (normalizedAudience.includes('students') || normalizedAudience.includes('parents')) {
    const students = await Student.find(courseQuery).select('_id userRef');

    if (normalizedAudience.includes('students')) {
      recipients.push(...students.map(student => student.userRef));
    }

    if (normalizedAudience.includes('parents')) {
      const parentUsers = await User.find({
        studentRef: { $in: students.map(student => student._id) },
        role: 'parent',
      }).select('_id');
      recipients.push(...parentUsers.map(user => user._id));
    }
  }

  if (normalizedAudience.includes('staff')) {
    recipients.push(...await getRoleRecipientIds([
      'super_admin',
      'admin',
      'accountant',
      'admission_staff',
      'class_teacher',
      'hostel_warden',
      'librarian',
      'shop_operator',
      'canteen_operator',
    ]));
  }

  return uniqIds(recipients);
};
