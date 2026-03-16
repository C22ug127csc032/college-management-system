const CheckIn = require('../models/CheckIn.model');
const Student = require('../models/Student.model');
const { sendSMS } = require('../utils/notifications');

exports.record = async (req, res) => {
  try {
    const { studentId, type, location, remarks } = req.body;
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const record = await CheckIn.create({ student: studentId, type, location, remarks, recordedBy: req.user.id });

    const msg = `${student.firstName} ${student.lastName} has ${type === 'check_in' ? 'entered' : 'exited'} ${location} at ${new Date().toLocaleTimeString()}.`;
    if (student.father?.phone) await sendSMS(student.father.phone, msg);
    if (student.mother?.phone) await sendSMS(student.mother.phone, msg);
    record.parentNotified = true;
    await record.save();

    res.status(201).json({ success: true, record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getRecords = async (req, res) => {
  try {
    const { studentId, type, location, startDate, endDate, page = 1, limit = 30 } = req.query;
    const query = {};
    if (studentId) query.student = studentId;
    if (type) query.type = type;
    if (location) query.location = location;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }
    const total = await CheckIn.countDocuments(query);
    const records = await CheckIn.find(query)
      .populate('student', 'firstName lastName regNo')
      .populate('recordedBy', 'name')
      .sort('-timestamp')
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ success: true, records, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
