const router = require('express').Router();
const pool = require('../db');
const { asyncHandler, required, httpError } = require('../utils');

const BASE = `
  SELECT mp.prescription_id, mp.patient_id, CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
         mp.prescribed_by, CONCAT(e.first_name, ' ', e.last_name) AS doctor_name,
         mp.medicine_sku, m.medicine_name, mp.dosage, mp.duration_days, mp.prescribed_on
  FROM med_prescription mp
  JOIN patient_master p ON p.patient_id = mp.patient_id
  JOIN employee_master e ON e.employee_id = mp.prescribed_by
  JOIN medicine_master m ON m.medicine_sku = mp.medicine_sku`;

// GET /api/prescriptions?patient_id=1&prescribed_by=1
router.get('/', asyncHandler(async (req, res) => {
  const { patient_id, prescribed_by } = req.query;
  const where = [];
  const params = [];
  if (patient_id) { where.push('mp.patient_id = ?'); params.push(patient_id); }
  if (prescribed_by) { where.push('mp.prescribed_by = ?'); params.push(prescribed_by); }

  const sql = `${BASE} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY mp.prescribed_on DESC`;
  const [rows] = await pool.query(sql, params);
  res.json(rows);
}));

// POST /api/prescriptions   body: { patient_id, medicine_sku, dosage, duration_days }
router.post('/', asyncHandler(async (req, res) => {
  required(req.body, ['patient_id', 'medicine_sku', 'dosage', 'duration_days']);
  const { patient_id, medicine_sku, dosage, duration_days } = req.body;

  const [result] = await pool.query(
    `INSERT INTO med_prescription (patient_id, prescribed_by, medicine_sku, dosage, duration_days)
     VALUES (?, ?, ?, ?, ?)`,
    [patient_id, req.user.id, medicine_sku, dosage, duration_days]);
  res.status(201).json({ prescription_id: result.insertId, message: 'Medicine prescribed' });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const [result] = await pool.query('DELETE FROM med_prescription WHERE prescription_id = ?', [req.params.id]);
  if (!result.affectedRows) throw httpError(404, 'Prescription not found');
  res.json({ message: 'Prescription deleted' });
}));

module.exports = router;