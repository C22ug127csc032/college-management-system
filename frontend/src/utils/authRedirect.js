export const OPERATOR_ROLES = ['shop_operator'];

export const getHomePathForRole = role => {
  if (role === 'student') return '/student';
  if (role === 'parent') return '/parent';
  if (role === 'shop_operator') return '/operator/shop';
  if (role === 'librarian') return '/admin/library/dashboard';
  if (role === 'accountant') return '/admin';
  if (role === 'admission_staff') return '/admin';
  return '/admin';
};

export const getLoginPathForRole = role => {
  if (role === 'student') return '/student/login';
  if (role === 'parent') return '/parent/login';
  if (OPERATOR_ROLES.includes(role)) return '/operator/login';
  return '/login';
};
