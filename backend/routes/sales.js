const router = require('express').Router();
const pool = require('../db');
const { asyncHandler } = require('../utils');

// GET /api/sales?patient_id=2
router.get('/', asyncHandler(async (req, res) => {
  const { patient_id } = req.query;
  const params = [];
  let where = '';
  if (patient_id) {
    where = 'WHERE s.patient_id = ?';
    params.push(patient_id);
  }
  const [rows] = await pool.query(
    `SELECT s.sales_trac_no, s.patient_id, CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
            s.medicine_sku, m.medicine_name, s.inv_line_id, s.quantity, s.sale_date, s.total_amount
     FROM med_sale s
     JOIN patient_master p ON p.patient_id = s.patient_id
     JOIN medicine_master m ON m.medicine_sku = s.medicine_sku
     ${where}
     ORDER BY s.sale_date DESC`, params);
  res.json(rows);
}));

module.exports = router;