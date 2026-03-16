import PDFDocument from 'pdfkit';

export const generateReceipt = (payment) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A5', margin: 40 });
    const buffers = [];
    doc.on('data', d => buffers.push(d));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const student = payment.student;
    const color = '#1a3c5e';

    // Header
    doc.rect(0, 0, doc.page.width, 70).fill(color);
    doc.fill('white').fontSize(18).font('Helvetica-Bold').text('College Management System', 40, 20);
    doc.fontSize(10).font('Helvetica').text('Payment Receipt', 40, 45);

    doc.fill(color).fontSize(12).font('Helvetica-Bold').text('PAYMENT RECEIPT', { align: 'center' });
    doc.moveDown(0.5);

    doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).stroke(color);
    doc.moveDown(0.5);

    const row = (label, value) => {
      doc.fontSize(10).font('Helvetica-Bold').fill('#444').text(label + ':', 40, doc.y, { continued: true, width: 150 });
      doc.font('Helvetica').fill('#000').text(value || '-', { align: 'left' });
      doc.moveDown(0.3);
    };

    row('Receipt No', payment.receiptNo);
    row('Date', new Date(payment.paymentDate).toLocaleDateString('en-IN'));
    row('Student Name', student ? `${student.firstName} ${student.lastName}` : '-');
    row('Reg. No', student?.regNo || '-');
    row('Course', student?.course?.name || '-');
    row('Payment Mode', payment.paymentMode?.toUpperCase());
    if (payment.razorpayPaymentId) row('Transaction ID', payment.razorpayPaymentId);

    doc.moveDown(0.5);
    doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).stroke(color);
    doc.moveDown(0.5);

    // Amount box
    doc.rect(40, doc.y, doc.page.width - 80, 40).fill('#f0f7ff');
    doc.fill(color).fontSize(14).font('Helvetica-Bold')
      .text(`Amount Paid: ₹${payment.amount.toLocaleString('en-IN')}`, 40, doc.y + 12, { align: 'center' });

    doc.moveDown(3.5);
    doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).stroke('#ccc');
    doc.fill('#888').fontSize(8).font('Helvetica')
      .text('This is a computer-generated receipt. No signature required.', { align: 'center' });

    doc.end();
  });
};

export default {
  generateReceipt,
};
