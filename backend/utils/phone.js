export const normalizePhone = value => {
  const digits = String(value || '').replace(/\D/g, '');

  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }

  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.slice(1);
  }

  return digits;
};

export const isValidIndianPhone = value => /^[6-9]\d{9}$/.test(normalizePhone(value));

export const assertValidIndianPhone = (value, label = 'Phone number') => {
  if (!isValidIndianPhone(value)) {
    throw new Error(`${label} must be a valid 10-digit Indian mobile number`);
  }
  return normalizePhone(value);
};
