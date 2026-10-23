const router = require('express').Router();
const pool = require('../db');
const { asyncHandler, required, httpError } = require('../utils');

// GET /api/rooms?status=available   (or occupied)
router.get('/', asyncHandler(async (req, res) => {
  let sql = `SELECT r.room_no, r.room_type, r.daily_charge, r.patient_id, r.admitted_on,
                    CONCAT(p.first_name, ' ', p.last_name) AS patient_name
             FROM room r
             LEFT JOIN patient_master p ON p.patient_id = r.patient_id`;
  if (req.query.status === 'available') sql += ' WHERE r.patient_id IS NULL';
  else if (req.query.status === 'occupied') sql += ' WHERE r.patient_id IS NOT NULL';
  sql += ' ORDER BY r.room_no';
  const [rows] = await pool.query(sql);
  res.json(rows);
}));

// POST /api/rooms
router.post('/', asyncHandler(async (req, res) => {
  required(req.body, ['room_no', 'room_type', 'daily_charge']);
  const { room_no, room_type, daily_charge } = req.body;
  await pool.query(
    'INSERT INTO room (room_no, room_type, daily_charge) VALUES (?, ?, ?)',
    [room_no, room_type, daily_charge]);
  res.status(201).json({ message: 'Room added' });
}));

// PUT /api/rooms/102/assign   body: { "patient_id": 2 }
router.put('/:room_no/assign', asyncHandler(async (req, res) => {
  required(req.body, ['patient_id']);
  const { patient_id } = req.body;

  const [[existing]] = await pool.query('SELECT room_no FROM room WHERE patient_id = ?', [patient_id]);
  if (existing) throw httpError(409, `Patient is already in room ${existing.room_no}`);

  const [result] = await pool.query(
    'UPDATE room SET patient_id = ?, admitted_on = NOW() WHERE room_no = ? AND patient_id IS NULL',
    [patient_id, req.params.room_no]);
  if (!result.affectedRows) throw httpError(409, 'Room not found or already occupied');
  res.json({ message: 'Room assigned' });
}));

// PUT /api/rooms/102/discharge
router.put('/:room_no/discharge', asyncHandler(async (req, res) => {
  const [result] = await pool.query(
    'UPDATE room SET patient_id = NULL, admitted_on = NULL WHERE room_no = ? AND patient_id IS NOT NULL',
    [req.params.room_no]);
  if (!result.affectedRows) throw httpError(409, 'Room not found or already empty');
  res.json({ message: 'Patient discharged, room is free' });
}));

// DELETE /api/rooms/102
router.delete('/:room_no', asyncHandler(async (req, res) => {
  const [result] = await pool.query('DELETE FROM room WHERE room_no = ?', [req.params.room_no]);
  if (!result.affectedRows) throw httpError(404, 'Room not found');
  res.json({ message: 'Room deleted' });
}));

module.exports = router;