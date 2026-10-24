const router = require('express').Router();
const pool = require('../db');
const { asyncHandler, httpError } = require('../utils');
const { authenticate, authorize } = require('../middleware/auth');
const { sendBillPdf, BILL_QUERY } = require('../pdf');

router.use(authenticate, authorize('patient'));

// GET /api/me/profile
router.get('/profile', asyncHandler(async (req, res) => {
  const id = req.user.id;
  const [[patient]] = await pool.query(
    `SELECT patient_id, first_name, last_name, dob, gender, phone, email, address, blood_group, registered_on
     FROM patient_master WHERE patient_id = ?`, [id]);
  if (!patient) throw httpError(404, 'Patient not found');

  const [insurance] = await pool.query('SELECT * FROM patient_insurance WHERE patient_id = ?', [id]);
  const [emergencyContacts] = await pool.query('SELECT * FROM patient_emergency_contact WHERE patient_id = ?', [id]);
  const [rooms] = await pool.query('SELECT room_no, room_type, admitted_on FROM room WHERE patient_id = ?', [id]);

  res.json({ ...patient, insurance, emergencyContacts, room: rooms[0] || null });
}));

// GET /api/me/lab-reports
router.get('/lab-reports', asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT l.lab_report_id, l.test_code, t.test_name, l.status, l.result_value,
            l.prescribed_on, l.reported_on,
            CONCAT(d.first_name, ' ', d.last_name) AS doctor_name
     FROM lab_report_results l
     JOIN test t ON t.test_code = l.test_code
     JOIN employee_master d ON d.employee_id = l.prescribed_by
     WHERE l.patient_id = ?
     ORDER BY l.prescribed_on DESC`, [req.user.id]);
  res.json(rows);
}));

// GET /api/me/prescriptions
router.get('/prescriptions', asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT mp.prescription_id, m.medicine_name, mp.dosage, mp.duration_days, mp.prescribed_on,
            CONCAT(e.first_name, ' ', e.last_name) AS doctor_name
     FROM med_prescription mp
     JOIN medicine_master m ON m.medicine_sku = mp.medicine_sku
     JOIN employee_master e ON e.employee_id = mp.prescribed_by
     WHERE mp.patient_id = ?
     ORDER BY mp.prescribed_on DESC`, [req.user.id]);
  res.json(rows);
}));

// GET /api/me/bills
router.get('/bills', asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT bill_no, bill_date, description, amount, status
     FROM billing WHERE patient_id = ? ORDER BY bill_date DESC`, [req.user.id]);
  res.json(rows);
}));

// GET /api/me/bills/1/pdf  (only the patient's OWN bill)
router.get('/bills/:id/pdf', asyncHandler(async (req, res) => {
  const [[bill]] = await pool.query(
    `${BILL_QUERY} WHERE b.bill_no = ? AND b.patient_id = ?`, [req.params.id, req.user.id]);
  if (!bill) throw httpError(404, 'Bill not found');
  sendBillPdf(res, bill);
}));

module.exports = router;