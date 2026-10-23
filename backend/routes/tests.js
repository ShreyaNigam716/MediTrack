const router = require('express').Router();
const pool = require('../db');
const { asyncHandler, required, buildUpdate, httpError } = require('../utils');

router.get('/', asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM test ORDER BY test_name');
  res.json(rows);
}));

router.post('/', asyncHandler(async (req, res) => {
  required(req.body, ['test_code', 'test_name', 'price']);
  const { test_code, test_name, price } = req.body;
  await pool.query('INSERT INTO test VALUES (?, ?, ?)', [test_code, test_name, price]);
  res.status(201).json({ message: 'Test added' });
}));

router.put('/:code', asyncHandler(async (req, res) => {
  const { setClause, values } = buildUpdate(req.body, ['test_name', 'price']);
  const [result] = await pool.query(
    `UPDATE test SET ${setClause} WHERE test_code = ?`, [...values, req.params.code]);
  if (!result.affectedRows) throw httpError(404, 'Test not found');
  res.json({ message: 'Test updated' });
}));

router.delete('/:code', asyncHandler(async (req, res) => {
  const [result] = await pool.query('DELETE FROM test WHERE test_code = ?', [req.params.code]);
  if (!result.affectedRows) throw httpError(404, 'Test not found');
  res.json({ message: 'Test deleted' });
}));

module.exports = router;