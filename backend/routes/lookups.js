const router = require('express').Router();
const pool = require('../db');
const { asyncHandler, required } = require('../utils');

// ---------- Departments ----------
router.get('/departments', asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM department ORDER BY department_name');
  res.json(rows);
}));

router.post('/departments', asyncHandler(async (req, res) => {
  required(req.body, ['department_code', 'department_name']);
  const { department_code, department_name } = req.body;
  await pool.query('INSERT INTO department VALUES (?, ?)', [department_code, department_name]);
  res.status(201).json({ message: 'Department added' });
}));

// ---------- Specialities ----------
router.get('/specialities', asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM speciality ORDER BY speciality_name');
  res.json(rows);
}));

router.post('/specialities', asyncHandler(async (req, res) => {
  required(req.body, ['speciality_code', 'speciality_name']);
  const { speciality_code, speciality_name } = req.body;
  await pool.query('INSERT INTO speciality VALUES (?, ?)', [speciality_code, speciality_name]);
  res.status(201).json({ message: 'Speciality added' });
}));

module.exports = router;