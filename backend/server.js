const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./db');
const errorHandler = require('./middleware/errorHandler');
const { authenticate, access } = require('./middleware/auth');

const app = express();

// In production, only your Vercel site may call the API (set FRONTEND_URL on Render)
app.use(cors({
  origin: process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : true,
}));

app.use(express.json());

// ---------- Public ----------
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', project: 'MediTrack' });
});

app.use('/api/auth', require('./routes/auth'));

// ---------- Patient-only (own data) ----------
app.use('/api/me', require('./routes/me'));

// ---------- Staff routes: login required + role rules ----------
// read = extra roles allowed for GET, write = roles allowed for everything (GET included)
const STAFF = ['doctor', 'lab_technician', 'admin', 'staff'];

app.use('/api/patients', authenticate,
  access({ read: STAFF, write: ['admin', 'staff'] }), require('./routes/patients'));

app.use('/api/employees', authenticate,
  access({ read: STAFF, write: ['admin'] }), require('./routes/employees'));

app.use('/api/lookups', authenticate,
  access({ read: STAFF, write: ['admin'] }), require('./routes/lookups'));

app.use('/api/rooms', authenticate,
  access({ read: STAFF, write: ['doctor', 'admin', 'staff'] }), require('./routes/rooms'));

app.use('/api/tests', authenticate,
  access({ read: STAFF, write: ['admin'] }), require('./routes/tests'));

app.use('/api/lab-reports', authenticate,
  access({ read: STAFF, write: ['doctor', 'lab_technician', 'admin'] }), require('./routes/labReports'));

app.use('/api/medicines', authenticate,
  access({ read: STAFF, write: ['admin', 'staff'] }), require('./routes/medicines'));

app.use('/api/prescriptions', authenticate,
  access({ read: ['admin', 'staff'], write: ['doctor'] }), require('./routes/prescriptions'));

app.use('/api/inventory', authenticate,
  access({ write: ['admin', 'staff'] }), require('./routes/inventory'));

app.use('/api/billing', authenticate,
  access({ write: ['admin', 'staff'] }), require('./routes/billing'));

app.use('/api/sales', authenticate,
  access({ write: ['admin', 'staff'] }), require('./routes/sales'));

app.use('/api/reports', authenticate,
  access({ write: ['admin'] }), require('./routes/reports'));

// Admin-only DB check
app.get('/api/db-check', authenticate, access({ write: ['admin'] }), async (req, res) => {
  try {
    const [tables] = await pool.query('SHOW TABLES');
    const key = Object.keys(tables[0])[0];
    const result = {};
    for (const row of tables) {
      const name = row[key];
      const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM \`${name}\``);
      result[name] = total;
    }
    res.json({ connected: true, tableCount: tables.length, rows: result });
  } catch (err) {
    res.status(500).json({ connected: false, error: err.message });
  }
});

// Unknown API route
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Must be last
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`MediTrack server running on http://localhost:${PORT}`);
});