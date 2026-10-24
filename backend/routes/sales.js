const router = require('express').Router();
const pool = require('../db');
const { asyncHandler, required, httpError } = require('../utils');

const round2 = (n) => Math.round(n * 100) / 100;

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
     ORDER BY s.sale_date DESC, s.sales_trac_no DESC`, params);
  res.json(rows);
}));

// POST /api/sales   body: { patient_id, medicine_sku, quantity }
// One transaction: lock stock -> insert sale rows -> reduce stock -> create bill.
// If ANY step fails, everything is rolled back.
router.post('/', asyncHandler(async (req, res) => {
  required(req.body, ['patient_id', 'medicine_sku', 'quantity']);
  const { patient_id, medicine_sku } = req.body;
  const quantity = Number(req.body.quantity);
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw httpError(400, 'Quantity must be a whole number greater than 0');
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[med]] = await conn.query(
      'SELECT medicine_name, unit_price FROM medicine_master WHERE medicine_sku = ?', [medicine_sku]);
    if (!med) throw httpError(404, 'Medicine not found');

    const [[pat]] = await conn.query(
      'SELECT patient_id FROM patient_master WHERE patient_id = ?', [patient_id]);
    if (!pat) throw httpError(404, 'Patient not found');

    // Lock the usable batches (not expired, not empty), earliest expiry first (FEFO)
    const [batches] = await conn.query(
      `SELECT inv_line_id, quantity FROM med_inventory
       WHERE medicine_sku = ? AND quantity > 0 AND expiry_date >= CURDATE()
       ORDER BY expiry_date, inv_line_id
       FOR UPDATE`, [medicine_sku]);

    const available = batches.reduce((sum, b) => sum + b.quantity, 0);
    if (available < quantity) {
      throw httpError(409, `Insufficient stock: only ${available} unit(s) available`);
    }

    // Take from the earliest-expiring batch first, spilling into the next if needed
    let remaining = quantity;
    let total = 0;
    let used = 0;
    for (const b of batches) {
      if (remaining === 0) break;
      const take = Math.min(remaining, b.quantity);
      const amount = round2(take * Number(med.unit_price));

      await conn.query(
        `INSERT INTO med_sale (patient_id, medicine_sku, inv_line_id, quantity, total_amount)
         VALUES (?, ?, ?, ?, ?)`,
        [patient_id, medicine_sku, b.inv_line_id, take, amount]);
      await conn.query(
        'UPDATE med_inventory SET quantity = quantity - ? WHERE inv_line_id = ?',
        [take, b.inv_line_id]);

      remaining -= take;
      total = round2(total + amount);
      used++;
    }

    const [bill] = await conn.query(
      'INSERT INTO billing (patient_id, description, amount) VALUES (?, ?, ?)',
      [patient_id, `Pharmacy: ${med.medicine_name} x ${quantity}`, total]);

    await conn.commit();
    res.status(201).json({
      message: 'Sale completed',
      bill_no: bill.insertId,
      total_amount: total,
      batches_used: used,
    });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}));

module.exports = router;