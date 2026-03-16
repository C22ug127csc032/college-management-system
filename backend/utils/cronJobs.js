import StudentFees from '../models/StudentFees.model.js';
import Student from '../models/Student.model.js';
import notifications from './notifications.js';
const { sendSMS, sendEmail } = notifications;
import moment from 'moment';

export const sendDueDateAlerts = async () => {
  try {
    const today = moment().startOf('day');
    const threeDaysLater = moment().add(3, 'days').endOf('day');

    // Upcoming dues (within 3 days)
    const upcoming = await StudentFees.find({
      status: { $in: ['pending', 'partial'] },
      dueDate: { $gte: today.toDate(), $lte: threeDaysLater.toDate() },
    }).populate('student');

    for (const fee of upcoming) {
      const s = fee.student;
      if (!s) continue;
      const daysLeft = moment(fee.dueDate).diff(today, 'days');
      const msg = `Reminder: Fee of ₹${fee.totalDue} is due in ${daysLeft} day(s) (${moment(fee.dueDate).format('DD/MM/YYYY')}). Student: ${s.firstName} ${s.lastName} (${s.regNo}).`;
      if (s.phone) await sendSMS(s.phone, msg);
      if (s.father?.phone) await sendSMS(s.father.phone, msg);
      if (s.email) await sendEmail(s.email, 'Fee Due Reminder', msg);
    }

    // Overdue — mark and alert
    const overdue = await StudentFees.find({
      status: { $in: ['pending', 'partial'] },
      dueDate: { $lt: today.toDate() },
    }).populate('student');

    for (const fee of overdue) {
      fee.status = 'overdue';
      await fee.save();
      const s = fee.student;
      if (!s) continue;
      const msg = `OVERDUE: Fee of ₹${fee.totalDue} was due on ${moment(fee.dueDate).format('DD/MM/YYYY')} and is now overdue. Student: ${s.firstName} ${s.lastName} (${s.regNo}). Please pay immediately.`;
      if (s.phone) await sendSMS(s.phone, msg);
      if (s.father?.phone) await sendSMS(s.father.phone, msg);
    }

    console.log(`✅ Due alerts sent: ${upcoming.length} upcoming, ${overdue.length} overdue`);
  } catch (err) {
    console.error('Cron error:', err.message);
  }
};

export default {
  sendDueDateAlerts,
};
