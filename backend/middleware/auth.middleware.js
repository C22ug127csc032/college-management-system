const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

exports.protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer '))
    token = req.headers.authorization.split(' ')[1];

  if (!token)
    return res.status(401).json({ success: false, message: 'Not authorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user || !req.user.isActive)
      return res.status(401).json({ success: false, message: 'Account deactivated or not found' });
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Token invalid or expired' });
  }
};

exports.authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role))
    return res.status(403).json({ success: false, message: `Role '${req.user.role}' not authorized` });
  next();
};

// Shorthand role guards
exports.adminOnly    = exports.authorize('super_admin');
exports.adminOrTeacher = exports.authorize('super_admin', 'class_teacher');
exports.hostelStaff  = exports.authorize('super_admin', 'hostel_warden');
exports.shopStaff    = exports.authorize('super_admin', 'shop_operator', 'canteen_operator');
exports.libStaff     = exports.authorize('super_admin', 'librarian');
