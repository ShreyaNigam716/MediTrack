const router = require('express').Router();
const pool = require('../db');
const { asyncHandler, required, buildUpdate, httpError } = require('../utils');

const FIELDS = ['first_name', 'last_name', 'dob', 'gender', 'phone', 'email', 'address', 'blood_group'];
// password_hash is deliberately left out so it never leaves the server
const PUBLIC_COLS =
  'patient_id, first_name, last_name, dob, gender, phone, email, address, blood_group, registered_on';

// GET /api/patients?search=rahul
router.get('/', asyncHandler(async (req, res) => {
  const { search } = req.query;
  let sql = `SELECT ${PUBLIC_COLS} FROM patient_master`;
  const params = [];
  if (search) {
    sql += ' WHERE first_name LIKE ? OR last_name LIKE ? OR phone LIKE ?';
    const like = `%${search}%`;
    params.push(like, like, like);
  }
  sql += ' ORDER BY patient_id DESC';
  const [rows] = await pool.query(sql, params);
  res.json(rows);
}));

// GET /api/patients/1  (patient + insurance + emergency contacts + room)
router.get('/:id', asyncHandler(async (req, res) => {
  const id = req.params.id;
  const [[patient]] = await pool.query(
    `SELECT ${PUBLIC_COLS} FROM patient_master WHERE patient_id = ?`, [id]);
  if (!patient) throw httpError(404, 'Patient not found');

  const [insurance] = await pool.query('SELECT * FROM patient_insurance WHERE patient_id = ?', [id]);
  const [emergencyContacts] = await pool.query('SELECT * FROM patient_emergency_contact WHERE patient_id = ?', [id]);
  const [rooms] = await pool.query('SELECT room_no, room_type, admitted_on FROM room WHERE patient_id = ?', [id]);

  res.json({ ...patient, insurance, emergencyContacts, room: rooms[0] || null });
}));

// POST /api/patients
router.post('/', asyncHandler(async (req, res) => {
  required(req.body, ['first_name', 'last_name', 'dob', 'gender']);
  const cols = FIELDS.filter((f) => req.body[f] !== undefined);
  const [result] = await pool.query(
    `INSERT INTO patient_master (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`,
    cols.map((c) => req.body[c])
  );
  res.status(201).json({ patient_id: result.insertId, message: 'Patient registered' });
}));

// PUT /api/patients/1
router.put('/:id', asyncHandler(async (req, res) => {
  const { setClause, values } = buildUpdate(req.body, FIELDS);
  const [result] = await pool.query(
    `UPDATE patient_master SET ${setClause} WHERE patient_id = ?`, [...values, req.params.id]);
  if (!result.affectedRows) throw httpError(404, 'Patient not found');
  res.json({ message: 'Patient updated' });
}));

// DELETE /api/patients/1  (fails with 409 if the patient has bills, reports, etc.)
router.delete('/:id', asyncHandler(async (req, res) => {
  const [result] = await pool.query('DELETE FROM patient_master WHERE patient_id = ?', [req.params.id]);
  if (!result.affectedRows) throw httpError(404, 'Patient not found');
  res.json({ message: 'Patient deleted' });
}));

// ---------- Insurance ----------
router.post('/:id/insurance', asyncHandler(async (req, res) => {
  required(req.body, ['provider_name', 'policy_number']);
  const { provider_name, policy_number, coverage_amount, valid_till } = req.body;
  const [result] = await pool.query(
    `INSERT INTO patient_insurance (patient_id, provider_name, policy_number, coverage_amount, valid_till)
     VALUES (?, ?, ?, ?, ?)`,
    [req.params.id, provider_name, policy_number, coverage_amount ?? null, valid_till ?? null]
  );
  res.status(201).json({ insurance_id: result.insertId, message: 'Insurance added' });
}));

router.delete('/:id/insurance/:insuranceId', asyncHandler(async (req, res) => {
  const [result] = await pool.query(
    'DELETE FROM patient_insurance WHERE insurance_id = ? AND patient_id = ?',
    [req.params.insuranceId, req.params.id]);
  if (!result.affectedRows) throw httpError(404, 'Insurance record not found');
  res.json({ message: 'Insurance removed' });
}));

// ---------- Emergency contacts ----------
router.post('/:id/emergency-contacts', asyncHandler(async (req, res) => {
  required(req.body, ['contact_name', 'phone']);
  const { contact_name, relation, phone } = req.body;
  const [result] = await pool.query(
    'INSERT INTO patient_emergency_contact (patient_id, contact_name, relation, phone) VALUES (?, ?, ?, ?)',
    [req.params.id, contact_name, relation ?? null, phone]
  );
  res.status(201).json({ ec_id: result.insertId, message: 'Emergency contact added' });
}));

router.delete('/:id/emergency-contacts/:ecId', asyncHandler(async (req, res) => {
  const [result] = await pool.query(
    'DELETE FROM patient_emergency_contact WHERE ec_id = ? AND patient_id = ?',
    [req.params.ecId, req.params.id]);
  if (!result.affectedRows) throw httpError(404, 'Emergency contact not found');
  res.json({ message: 'Emergency contact removed' });
}));

module.exports = router;