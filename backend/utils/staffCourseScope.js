import mongoose from 'mongoose';
import Course from '../models/Course.model.js';
import Student from '../models/Student.model.js';

export const getTeacherCourseIds = async user => {
  if (user?.role !== 'class_teacher' || !user.department) return [];

  const department = String(user.department).trim();
  const escapedDepartment = department.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const exactMatch = new RegExp(`^${escapedDepartment}$`, 'i');
  const filters = [
    { name: exactMatch },
    { code: exactMatch },
    { department: exactMatch },
  ];

  if (mongoose.Types.ObjectId.isValid(department)) {
    filters.unshift({ _id: department });
  }

  if (user?._id && mongoose.Types.ObjectId.isValid(String(user._id))) {
    filters.unshift({ classTeacher: user._id });
  }

  const courses = await Course.find({ $or: filters }).select('_id');
  return courses.map(course => course._id);
};

export const classTeacherHasCourseAccess = async (user, courseId) => {
  if (user?.role !== 'class_teacher') return true;
  const teacherCourseIds = await getTeacherCourseIds(user);
  return teacherCourseIds.some(id => String(id) === String(courseId));
};

export const classTeacherHasStudentAccess = async (user, studentId) => {
  if (user?.role !== 'class_teacher') return true;

  const student = await Student.findById(studentId).select('course');
  if (!student) return false;

  return classTeacherHasCourseAccess(user, student.course);
};
