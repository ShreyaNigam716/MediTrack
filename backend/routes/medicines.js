const router = require('express').Router();
const pool = require('../db');
const { asyncHandler, required, buildUpdate, httpError } = require('../utils');

// GET /api/medicines   (includes total stock across all batches)
router.get('/', asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT m.medicine_sku, m.medicine_name, m.manufacturer, m.unit_price,
            COALESCE(SUM(i.quantity), 0) AS total_stock
     FROM medicine_master m
     LEFT JOIN med_inventory i ON i.medicine_sku = m.medicine_sku
     GROUP BY m.medicine_sku, m.medicine_name, m.manufacturer, m.unit_price
     ORDER BY m.medicine_name`);
  res.json(rows);
}));

router.post('/', asyncHandler(async (req, res) => {
  required(req.body, ['medicine_sku', 'medicine_name', 'unit_price']);
  const { medicine_sku, medicine_name, manufacturer, unit_price } = req.body;
  await pool.query(
    'INSERT INTO medicine_master VALUES (?, ?, ?, ?)',
    [medicine_sku, medicine_name, manufacturer ?? null, unit_price]);
  res.status(201).json({ message: 'Medicine added' });
}));

router.put('/:sku', asyncHandler(async (req, res) => {
  const { setClause, values } = buildUpdate(req.body, ['medicine_name', 'manufacturer', 'unit_price']);
  const [result] = await pool.query(
    `UPDATE medicine_master SET ${setClause} WHERE medicine_sku = ?`, [...values, req.params.sku]);
  if (!result.affectedRows) throw httpError(404, 'Medicine not found');
  res.json({ message: 'Medicine updated' });
}));

router.delete('/:sku', asyncHandler(async (req, res) => {
  const [result] = await pool.query('DELETE FROM medicine_master WHERE medicine_sku = ?', [req.params.sku]);
  if (!result.affectedRows) throw httpError(404, 'Medicine not found');
  res.json({ message: 'Medicine deleted' });
}));

module.exports = router;