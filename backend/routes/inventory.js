const router = require('express').Router();
const pool = require('../db');
const { asyncHandler, required, httpError } = require('../utils');

// GET /api/inventory   (all batches, soonest expiry first)
router.get('/', asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT i.inv_line_id, i.medicine_sku, m.medicine_name, i.batch_no,
            i.quantity, i.expiry_date, i.received_on
     FROM med_inventory i
     JOIN medicine_master m ON m.medicine_sku = i.medicine_sku
     ORDER BY i.expiry_date`);
  res.json(rows);
}));

// GET /api/inventory/low-stock?threshold=250
router.get('/low-stock', asyncHandler(async (req, res) => {
  const threshold = Number(req.query.threshold) || 100;
  const [rows] = await pool.query(
    `SELECT m.medicine_sku, m.medicine_name, COALESCE(SUM(i.quantity), 0) AS total_stock
     FROM medicine_master m
     LEFT JOIN med_inventory i ON i.medicine_sku = m.medicine_sku
     GROUP BY m.medicine_sku, m.medicine_name
     HAVING total_stock < ?
     ORDER BY total_stock`, [threshold]);
  res.json(rows);
}));

// POST /api/inventory   body: { medicine_sku, batch_no, quantity, expiry_date, received_on? }
router.post('/', asyncHandler(async (req, res) => {
  required(req.body, ['medicine_sku', 'batch_no', 'quantity', 'expiry_date']);
  const { medicine_sku, batch_no, quantity, expiry_date, received_on } = req.body;
  const [result] = await pool.query(
    `INSERT INTO med_inventory (medicine_sku, batch_no, quantity, expiry_date, received_on)
     VALUES (?, ?, ?, ?, COALESCE(?, CURDATE()))`,
    [medicine_sku, batch_no, quantity, expiry_date, received_on || null]);
  res.status(201).json({ inv_line_id: result.insertId, message: 'Stock batch added' });
}));

// PUT /api/inventory/1   body: { quantity }
router.put('/:id', asyncHandler(async (req, res) => {
  required(req.body, ['quantity']);
  const [result] = await pool.query(
    'UPDATE med_inventory SET quantity = ? WHERE inv_line_id = ?', [req.body.quantity, req.params.id]);
  if (!result.affectedRows) throw httpError(404, 'Inventory line not found');
  res.json({ message: 'Quantity updated' });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const [result] = await pool.query('DELETE FROM med_inventory WHERE inv_line_id = ?', [req.params.id]);
  if (!result.affectedRows) throw httpError(404, 'Inventory line not found');
  res.json({ message: 'Inventory line deleted' });
}));

module.exports = router;