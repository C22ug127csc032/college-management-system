const Outpass = require('../models/Outpass.model');
const Student = require('../models/Student.model');
const { sendSMS } = require('../utils/notifications');

exports.createOutpass = async (req, res) => {
  try {
    const { studentId, exitDate, exitTime, expectedReturn, reason, destination } = req.body;
    const outpass = await Outpass.create({
      student: studentId, requestedBy: req.user.id,
      exitDate, exitTime, expectedReturn, reason, destination,
    });
    res.status(201).json({ success: true, outpass });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getOutpasses = async (req, res) => {
  try {
    const { studentId, status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (studentId) query.student = studentId;
    if (status) query.status = status;
    if (req.user.role === 'student') {
      const student = await Student.findOne({ userRef: req.user.id });
      if (student) query.student = student._id;
    }
    const total = await Outpass.countDocuments(query);
    const outpasses = await Outpass.find(query)
      .populate('student', 'firstName lastName regNo phone father')
      .populate('approvedBy', 'name role')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ success: true, outpasses, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateOutpassStatus = async (req, res) => {
  try {
    const { status, remarks } = req.body;
    const outpass = await Outpass.findByIdAndUpdate(req.params.id, {
      status, remarks, approvedBy: req.user.id, approvedAt: new Date()
    }, { new: true }).populate('student', 'firstName lastName phone father');
    if (!outpass) return res.status(404).json({ success: false, message: 'Outpass not found' });

    const student = outpass.student;
    const msg = `Outpass request ${status} for exit on ${outpass.exitDate?.toDateString()}. ${remarks ? 'Remarks: ' + remarks : ''}`;
    if (student?.phone) await sendSMS(student.phone, msg);
    if (student?.father?.phone) await sendSMS(student.father.phone, msg);
    outpass.parentNotified = true;
    await outpass.save();

    res.json({ success: true, outpass });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.markReturned = async (req, res) => {
  try {
    const outpass = await Outpass.findByIdAndUpdate(req.params.id, {
      status: 'returned', actualReturn: new Date()
    }, { new: true }).populate('student', 'firstName lastName phone father');

    const student = outpass.student;
    const msg = `Student ${student?.firstName} has returned to hostel on ${new Date().toLocaleString()}.`;
    if (student?.father?.phone) await sendSMS(student.father.phone, msg);

    res.json({ success: true, outpass });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
