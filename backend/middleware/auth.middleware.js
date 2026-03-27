import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';

export const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer '))
    token = req.headers.authorization.split(' ')[1];

  if (!token)
    return res.status(401).json({ success: false, message: 'Not authorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (req.user?.role === 'canteen_operator') req.user.role = 'shop_operator';
    if (!req.user || !req.user.isActive)
      return res.status(401).json({ success: false, message: 'Account deactivated' });
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Token invalid or expired' });
  }
};

export const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role))
    return res.status(403).json({ success: false, message: `Role '${req.user.role}' not authorized` });
  next();
};

export const superAdminOnly = authorize('super_admin');
export const adminOnly      = authorize('super_admin', 'admin');
export const financeStaff   = authorize('super_admin', 'admin', 'accountant');
export const admissionStaff = authorize('super_admin', 'admin', 'admission_staff');
export const adminOrTeacher = authorize('super_admin', 'admin', 'class_teacher');
export const adminTeacherOrFinance = authorize('super_admin', 'admin', 'class_teacher', 'accountant');
export const adminOrTeacherOrWarden = authorize('super_admin', 'admin', 'class_teacher', 'hostel_warden');
export const adminWardenOrFinance = authorize('super_admin', 'admin', 'class_teacher', 'hostel_warden', 'accountant');
export const studentOfficeStaff = authorize(
  'super_admin',
  'admin',
  'class_teacher',
  'hostel_warden',
  'accountant',
  'admission_staff'
);
export const studentManagementStaff = authorize('super_admin', 'admin', 'admission_staff');
export const studentEnrollmentStaff = authorize('super_admin', 'admin', 'admission_staff', 'class_teacher');
export const hostelStaff    = authorize('super_admin', 'admin', 'hostel_warden', 'class_teacher');
export const hostelWardenOnly = authorize('hostel_warden');
export const hostelOutpassStaff = authorize('super_admin', 'admin', 'hostel_warden');
export const shopStaff      = authorize('super_admin', 'admin', 'shop_operator');
export const libStaff       = authorize('super_admin', 'admin', 'librarian');
export const parentOnly     = authorize('parent');
export const studentOnly    = authorize('student');

export default {
  protect,
  authorize,
  superAdminOnly,
  adminOnly,
  financeStaff,
  admissionStaff,
  adminOrTeacher,
  adminTeacherOrFinance,
  adminOrTeacherOrWarden,
  adminWardenOrFinance,
  studentOfficeStaff,
  studentManagementStaff,
  studentEnrollmentStaff,
  hostelStaff,
  hostelWardenOnly,
  hostelOutpassStaff,
  shopStaff,
  libStaff,
  parentOnly,
  studentOnly,
};
