const router = require('express').Router();
const pool = require('../db');
const { asyncHandler } = require('../utils');

// Revenue per medicine (JOIN + GROUP BY + SUM)
router.get('/sales-by-medicine', asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT m.medicine_name, SUM(s.quantity) AS units_sold, SUM(s.total_amount) AS revenue
     FROM med_sale s
     JOIN medicine_master m ON m.medicine_sku = s.medicine_sku
     GROUP BY m.medicine_sku, m.medicine_name
     ORDER BY revenue DESC`);
  res.json(rows);
}));

// Pharmacy sales per month
router.get('/monthly-sales', asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT DATE_FORMAT(sale_date, '%Y-%m') AS month,
            COUNT(*) AS transactions, SUM(total_amount) AS revenue
     FROM med_sale
     GROUP BY month
     ORDER BY month DESC`);
  res.json(rows);
}));

// Doctor-wise workload (correlated subqueries + EXISTS)
router.get('/doctor-workload', asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT e.employee_id,
            CONCAT(e.first_name, ' ', e.last_name) AS doctor_name,
            d.department_name,
            (SELECT COUNT(*) FROM patient_master p
              WHERE EXISTS (SELECT 1 FROM lab_report_results l
                            WHERE l.patient_id = p.patient_id AND l.prescribed_by = e.employee_id)
                 OR EXISTS (SELECT 1 FROM med_prescription mp
                            WHERE mp.patient_id = p.patient_id AND mp.prescribed_by = e.employee_id)
            ) AS patients_treated,
            (SELECT COUNT(*) FROM lab_report_results l
              WHERE l.prescribed_by = e.employee_id) AS tests_prescribed,
            (SELECT COUNT(*) FROM med_prescription mp
              WHERE mp.prescribed_by = e.employee_id) AS medicines_prescribed
     FROM employee_master e
     JOIN department d ON d.department_code = e.department_code
     WHERE e.role = 'doctor'
     ORDER BY patients_treated DESC`);
  res.json(rows);
}));

// Batches expiring soon: /api/reports/expiring?days=365
router.get('/expiring', asyncHandler(async (req, res) => {
  const days = Number(req.query.days) || 90;
  const [rows] = await pool.query(
    `SELECT i.inv_line_id, m.medicine_name, i.batch_no, i.quantity, i.expiry_date,
            DATEDIFF(i.expiry_date, CURDATE()) AS days_left
     FROM med_inventory i
     JOIN medicine_master m ON m.medicine_sku = i.medicine_sku
     WHERE i.quantity > 0 AND i.expiry_date <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
     ORDER BY i.expiry_date`, [days]);
  res.json(rows);
}));

// Billing totals by status
router.get('/revenue', asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT status, COUNT(*) AS bills, SUM(amount) AS total
     FROM billing GROUP BY status`);
  res.json(rows);
}));

// Uses the patient_summary VIEW
router.get('/patient-summary', asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM patient_summary ORDER BY patient_id');
  res.json(rows);
}));

module.exports = router;