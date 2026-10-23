const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./db');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

// Health + DB check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', project: 'MediTrack' });
});

app.get('/api/db-check', async (req, res) => {
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

// Routes
app.use('/api/patients', require('./routes/patients'));
app.use('/api/employees', require('./routes/employees'));
app.use('/api/lookups', require('./routes/lookups'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/tests', require('./routes/tests'));
app.use('/api/lab-reports', require('./routes/labReports'));
app.use('/api/medicines', require('./routes/medicines'));
app.use('/api/prescriptions', require('./routes/prescriptions'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/billing', require('./routes/billing'));
app.use('/api/sales', require('./routes/sales'));

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