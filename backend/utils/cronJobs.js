import StudentFees from '../models/StudentFees.model.js';
import Ledger from '../models/Ledger.model.js';
import notifications from './notifications.js';
const { sendSMS, sendEmail } = notifications;
import moment from 'moment';

const LATE_FEE_HEAD = 'Late Fee Fine';

const toNumber = value => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const getConfiguredFineAmount = fee => {
  const structure = fee?.structure;
  if (!structure?.fineEnabled) return 0;

  const fineAmount = toNumber(structure.fineAmount);
  if (fineAmount <= 0) return 0;

  const overdueDays = Math.max(
    moment().startOf('day').diff(moment(fee.dueDate).startOf('day'), 'days'),
    0
  );
  const graceDays = Math.max(toNumber(structure.fineGraceDays), 0);
  const chargeableDays = Math.max(overdueDays - graceDays, 0);
  if (chargeableDays <= 0) return 0;

  if (structure.fineType === 'percentage') {
    const baseAmount = toNumber(fee.totalAmount);
    return Number((((baseAmount * fineAmount) / 100) * chargeableDays).toFixed(2));
  }

  return Number((fineAmount * chargeableDays).toFixed(2));
};

const applyOverdueFine = async fee => {
  const configuredFine = getConfiguredFineAmount(fee);
  if (configuredFine <= 0) return 0;

  const existingFineHead = fee.feeHeads?.find(head => head.headName === LATE_FEE_HEAD);
  const alreadyApplied = toNumber(existingFineHead?.amount);
  const fineToApply = Math.max(configuredFine - alreadyApplied, 0);

  if (fineToApply <= 0) return 0;

  if (existingFineHead) {
    existingFineHead.amount = toNumber(existingFineHead.amount) + fineToApply;
    existingFineHead.due = toNumber(existingFineHead.due) + fineToApply;
  } else {
    fee.feeHeads.push({
      headName: LATE_FEE_HEAD,
      amount: fineToApply,
      paid: 0,
      due: fineToApply,
    });
  }

  fee.totalFine = toNumber(fee.totalFine) + fineToApply;

  await Ledger.create({
    student: fee.student?._id || fee.student,
    type: 'debit',
    category: 'fine',
    amount: fineToApply,
    description: `Overdue fine applied for due date ${moment(fee.dueDate).format('DD/MM/YYYY')}`,
    feesRef: fee._id,
    academicYear: fee.academicYear,
    date: new Date(),
    createdBy: fee.assignedBy || undefined,
  });

  return fineToApply;
};

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
      const msg = `Reminder: Fee of Rs ${fee.totalDue} is due in ${daysLeft} day(s) (${moment(fee.dueDate).format('DD/MM/YYYY')}). Student: ${s.firstName} ${s.lastName} (${s.regNo}).`;
      if (s.phone) await sendSMS(s.phone, msg);
      if (s.father?.phone) await sendSMS(s.father.phone, msg);
      if (s.email) await sendEmail(s.email, 'Fee Due Reminder', msg);
    }

    // Overdue - mark, apply fine from structure, and alert
    const overdue = await StudentFees.find({
      status: { $in: ['pending', 'partial', 'overdue'] },
      dueDate: { $lt: today.toDate() },
    })
      .populate('student')
      .populate('structure', 'fineEnabled fineType fineAmount fineGraceDays');

    for (const fee of overdue) {
      const appliedFine = await applyOverdueFine(fee);
      fee.status = 'overdue';
      await fee.save();

      const s = fee.student;
      if (!s) continue;
      const fineNote = appliedFine > 0 ? ` Late fine applied: Rs ${appliedFine}.` : '';
      const msg = `OVERDUE: Fee of Rs ${fee.totalDue} was due on ${moment(fee.dueDate).format('DD/MM/YYYY')} and is now overdue.${fineNote} Student: ${s.firstName} ${s.lastName} (${s.regNo}). Please pay immediately.`;
      if (s.phone) await sendSMS(s.phone, msg);
      if (s.father?.phone) await sendSMS(s.father.phone, msg);
    }

    console.log(`Due alerts sent: ${upcoming.length} upcoming, ${overdue.length} overdue`);
  } catch (err) {
    console.error('Cron error:', err.message);
  }
};

export default {
  sendDueDateAlerts,
};
