const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { asyncHandler, required, httpError } = require('../utils');
const { authenticate } = require('../middleware/auth');

const signToken = (user) =>
  jwt.sign(
    { id: user.id, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );

// POST /api/auth/login   body: { email, password }
// Works for employees (doctor, lab_technician, staff, admin) and patients
router.post('/login', asyncHandler(async (req, res) => {
  required(req.body, ['email', 'password']);
  const { email, password } = req.body;

  let user = null;

  const [[emp]] = await pool.query(
    `SELECT employee_id, first_name, last_name, role, password_hash
     FROM employee_master WHERE email = ?`, [email]);

  if (emp) {
    user = {
      id: emp.employee_id,
      name: `${emp.first_name} ${emp.last_name}`,
      role: emp.role,
      hash: emp.password_hash,
    };
  } else {
    const [[pat]] = await pool.query(
      `SELECT patient_id, first_name, last_name, password_hash
       FROM patient_master WHERE email = ?`, [email]);
    if (pat) {
      user = {
        id: pat.patient_id,
        name: `${pat.first_name} ${pat.last_name}`,
        role: 'patient',
        hash: pat.password_hash,
      };
    }
  }

  const ok = user && user.hash && (await bcrypt.compare(password, user.hash));
  if (!ok) throw httpError(401, 'Invalid email or password');

  res.json({
    token: signToken(user),
    user: { id: user.id, name: user.name, role: user.role },
  });
}));

// POST /api/auth/register   (patient self-registration)
router.post('/register', asyncHandler(async (req, res) => {
  required(req.body, ['first_name', 'last_name', 'dob', 'gender', 'email', 'password']);
  const { first_name, last_name, dob, gender, email, password, phone, address, blood_group } = req.body;

  if (password.length < 6) throw httpError(400, 'Password must be at least 6 characters');

  const [[taken]] = await pool.query('SELECT 1 AS x FROM employee_master WHERE email = ?', [email]);
  if (taken) throw httpError(409, 'Duplicate entry: that email is already registered');

  const hash = await bcrypt.hash(password, 10);
  const [result] = await pool.query(
    `INSERT INTO patient_master
       (first_name, last_name, dob, gender, email, phone, address, blood_group, password_hash)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [first_name, last_name, dob, gender, email, phone ?? null, address ?? null, blood_group ?? null, hash]);

  res.status(201).json({ patient_id: result.insertId, message: 'Registered. You can now log in.' });
}));

// GET /api/auth/me   (who am I, from the token)
router.get('/me', authenticate, (req, res) => {
  res.json({ id: req.user.id, name: req.user.name, role: req.user.role });
});

module.exports = router;