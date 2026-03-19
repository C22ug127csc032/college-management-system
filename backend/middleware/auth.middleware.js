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

export const adminOnly      = authorize('super_admin');
export const adminOrTeacher = authorize('super_admin', 'class_teacher');
export const hostelStaff    = authorize('super_admin', 'hostel_warden', 'class_teacher');
export const shopStaff      = authorize('super_admin', 'shop_operator');
export const libStaff       = authorize('super_admin', 'librarian');
export const parentOnly     = authorize('parent');
export const studentOnly    = authorize('student');

export default {
  protect,
  authorize,
  adminOnly,
  adminOrTeacher,
  hostelStaff,
  shopStaff,
  libStaff,
  parentOnly,
  studentOnly,
};
