const bcrypt = require('bcryptjs');
const pool = require('../db');

(async () => {
  const hash = await bcrypt.hash('meditrack123', 10);

  const [emp] = await pool.query(
    'UPDATE employee_master SET password_hash = ? WHERE password_hash IS NULL', [hash]);
  const [pat] = await pool.query(
    'UPDATE patient_master SET password_hash = ? WHERE password_hash IS NULL AND email IS NOT NULL', [hash]);

  console.log(`Passwords set: ${emp.affectedRows} employees, ${pat.affectedRows} patients`);
  await pool.end();
})();