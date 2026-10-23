const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./db');

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', project: 'MediTrack' });
});

// Checks the database connection and counts rows in every table
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

// Temporary test route (replaced by proper routes in Section 2)
app.get('/api/patients', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM patient_master');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`MediTrack server running on http://localhost:${PORT}`);
});