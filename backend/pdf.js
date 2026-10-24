const PDFDocument = require('pdfkit');

// The default PDF font can't draw the rupee symbol, so we write "Rs."
const inr = (n) =>
  `Rs. ${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const BILL_QUERY = `
  SELECT b.bill_no, b.bill_date, b.description, b.amount, b.status,
         p.patient_id, CONCAT(p.first_name, ' ', p.last_name) AS patient_name, p.phone, p.email
  FROM billing b
  JOIN patient_master p ON p.patient_id = b.patient_id`;

function sendBillPdf(res, bill) {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="MediTrack-Bill-${bill.bill_no}.pdf"`);
  doc.pipe(res);

  doc.fontSize(24).fillColor('#115e59').text('MediTrack', { align: 'center' });
  doc.fontSize(10).fillColor('#64748b')
     .text('Patient, Lab and Pharmacy Management System', { align: 'center' });
  doc.moveDown(1.5);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#cbd5e1').stroke();
  doc.moveDown();

  doc.fontSize(14).fillColor('#0f172a').text(`Invoice #${bill.bill_no}`);
  doc.fontSize(10).fillColor('#475569')
     .text(`Date: ${new Date(bill.bill_date).toLocaleDateString('en-IN')}`);
  doc.text(`Status: ${bill.status.toUpperCase()}`);
  doc.moveDown();

  doc.fontSize(11).fillColor('#0f172a').text('Billed to', { underline: true });
  doc.fontSize(10).text(bill.patient_name);
  doc.text(`Patient ID: ${bill.patient_id}`);
  if (bill.phone) doc.text(`Phone: ${bill.phone}`);
  if (bill.email) doc.text(bill.email);
  doc.moveDown(1.5);

  const y = doc.y;
  doc.fontSize(10).fillColor('#64748b')
     .text('Description', 50, y)
     .text('Amount', 400, y, { width: 145, align: 'right' });
  doc.moveTo(50, y + 16).lineTo(545, y + 16).strokeColor('#cbd5e1').stroke();

  const rowY = y + 26;
  doc.fillColor('#0f172a').text(bill.description || 'Hospital charges', 50, rowY, { width: 330 });
  const rowEnd = doc.y;
  doc.text(inr(bill.amount), 400, rowY, { width: 145, align: 'right' });

  const lineY = rowEnd + 12;
  doc.moveTo(50, lineY).lineTo(545, lineY).strokeColor('#cbd5e1').stroke();
  doc.fontSize(12).fillColor('#115e59')
     .text('Total', 50, lineY + 12)
     .text(inr(bill.amount), 400, lineY + 12, { width: 145, align: 'right' });

  doc.fontSize(9).fillColor('#94a3b8')
     .text('This is a computer-generated invoice.', 50, 760, { width: 495, align: 'center' });

  doc.end();
}

module.exports = { sendBillPdf, BILL_QUERY };