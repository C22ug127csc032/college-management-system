export const normalizeStudentIdentifier = value =>
  String(value || '').trim().toUpperCase();

export const buildStudentIdentifierQuery = identifier => {
  const normalized = normalizeStudentIdentifier(identifier);
  return {
    $or: [
      { rollNo: normalized },
      { admissionNo: normalized },
    ],
  };
};

export const getPreferredStudentIdentifier = student =>
  student?.rollNo || student?.admissionNo || '';

export const getPreferredStudentIdentifierLabel = student =>
  student?.rollNo ? 'Roll No' : student?.admissionNo ? 'Admission No' : 'Phone number';
