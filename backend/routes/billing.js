const router = require('express').Router();
const pool = require('../db');
const { asyncHandler, required, httpError } = require('../utils');
const { sendBillPdf, BILL_QUERY } = require('../pdf');

// GET /api/billing?patient_id=1&status=pending
router.get('/', asyncHandler(async (req, res) => {
  const { patient_id, status } = req.query;
  const where = [];
  const params = [];
  if (patient_id) { where.push('b.patient_id = ?'); params.push(patient_id); }
  if (status) { where.push('b.status = ?'); params.push(status); }

  const [rows] = await pool.query(
    `SELECT b.bill_no, b.patient_id, CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
            b.bill_date, b.description, b.amount, b.status
     FROM billing b
     JOIN patient_master p ON p.patient_id = b.patient_id
     ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
     ORDER BY b.bill_date DESC`, params);
  res.json(rows);
}));

// POST /api/billing   body: { patient_id, description, amount }
router.post('/', asyncHandler(async (req, res) => {
  required(req.body, ['patient_id', 'amount']);
  const { patient_id, description, amount } = req.body;
  const [result] = await pool.query(
    'INSERT INTO billing (patient_id, description, amount) VALUES (?, ?, ?)',
    [patient_id, description ?? null, amount]);
  res.status(201).json({ bill_no: result.insertId, message: 'Bill created' });
}));

// PUT /api/billing/1/pay
router.put('/:id/pay', asyncHandler(async (req, res) => {
  const [result] = await pool.query(
    "UPDATE billing SET status = 'paid' WHERE bill_no = ? AND status = 'pending'", [req.params.id]);
  if (!result.affectedRows) throw httpError(409, 'Bill not found or already paid');
  res.json({ message: 'Bill marked as paid' });
}));

// GET /api/billing/1/pdf
router.get('/:id/pdf', asyncHandler(async (req, res) => {
  const [[bill]] = await pool.query(`${BILL_QUERY} WHERE b.bill_no = ?`, [req.params.id]);
  if (!bill) throw httpError(404, 'Bill not found');
  sendBillPdf(res, bill);
}));
module.exports = router;