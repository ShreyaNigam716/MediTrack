const router = require('express').Router();
const pool = require('../db');
const { asyncHandler, required, httpError } = require('../utils');
const { authorize } = require('../middleware/auth');

const BASE = `
  SELECT l.lab_report_id, l.test_code, t.test_name,
         l.patient_id, CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
         l.prescribed_by, CONCAT(d.first_name, ' ', d.last_name) AS doctor_name,
         l.generated_by, CONCAT(g.first_name, ' ', g.last_name) AS technician_name,
         l.status, l.result_value, l.prescribed_on, l.reported_on
  FROM lab_report_results l
  JOIN test t ON t.test_code = l.test_code
  JOIN patient_master p ON p.patient_id = l.patient_id
  JOIN employee_master d ON d.employee_id = l.prescribed_by
  LEFT JOIN employee_master g ON g.employee_id = l.generated_by`;

// GET /api/lab-reports?patient_id=1&status=pending&prescribed_by=1
router.get('/', asyncHandler(async (req, res) => {
  const { patient_id, status, prescribed_by } = req.query;
  const where = [];
  const params = [];
  if (patient_id) { where.push('l.patient_id = ?'); params.push(patient_id); }
  if (status) { where.push('l.status = ?'); params.push(status); }
  if (prescribed_by) { where.push('l.prescribed_by = ?'); params.push(prescribed_by); }

  const sql = `${BASE} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY l.prescribed_on DESC`;
  const [rows] = await pool.query(sql, params);
  res.json(rows);
}));

// GET /api/lab-reports/1
router.get('/:id', asyncHandler(async (req, res) => {
  const [[row]] = await pool.query(`${BASE} WHERE l.lab_report_id = ?`, [req.params.id]);
  if (!row) throw httpError(404, 'Lab report not found');
  res.json(row);
}));

// POST /api/lab-reports   body: { test_code, patient_id }   (doctor only, id from token)
router.post('/', asyncHandler(async (req, res) => {
  if (req.user.role !== 'doctor') throw httpError(403, 'Only doctors can prescribe tests');
  required(req.body, ['test_code', 'patient_id']);
  const { test_code, patient_id } = req.body;

  const [result] = await pool.query(
    'INSERT INTO lab_report_results (test_code, patient_id, prescribed_by) VALUES (?, ?, ?)',
    [test_code, patient_id, req.user.id]);
  res.status(201).json({ lab_report_id: result.insertId, message: 'Test prescribed' });
}));

// PUT /api/lab-reports/4/result   body: { result_value }   (lab technician only)
router.put('/:id/result', asyncHandler(async (req, res) => {
  if (req.user.role !== 'lab_technician') throw httpError(403, 'Only lab technicians can upload results');
  required(req.body, ['result_value']);

  const [result] = await pool.query(
    `UPDATE lab_report_results
     SET result_value = ?, generated_by = ?, status = 'completed', reported_on = NOW()
     WHERE lab_report_id = ? AND status = 'pending'`,
    [req.body.result_value, req.user.id, req.params.id]);
  if (!result.affectedRows) throw httpError(409, 'Report not found or already completed');
  res.json({ message: 'Result uploaded' });
}));

// DELETE /api/lab-reports/4  (only pending ones; doctor or admin)
router.delete('/:id', authorize('doctor', 'admin'), asyncHandler(async (req, res) => {
  const [result] = await pool.query(
    "DELETE FROM lab_report_results WHERE lab_report_id = ? AND status = 'pending'", [req.params.id]);
  if (!result.affectedRows) throw httpError(409, 'Report not found or already completed');
  res.json({ message: 'Prescribed test cancelled' });
}));

module.exports = router;