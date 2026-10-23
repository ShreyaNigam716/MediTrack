const router = require('express').Router();
const pool = require('../db');
const { asyncHandler, required, buildUpdate, httpError } = require('../utils');

const FIELDS = ['first_name', 'last_name', 'email', 'phone', 'role', 'hire_date', 'department_code'];

// GET /api/employees?role=doctor
router.get('/', asyncHandler(async (req, res) => {
  const { role } = req.query;
  const params = [];
  let where = '';
  if (role) {
    where = 'WHERE e.role = ?';
    params.push(role);
  }
  const [rows] = await pool.query(
    `SELECT e.employee_id, e.first_name, e.last_name, e.email, e.phone, e.role, e.hire_date,
            e.department_code, d.department_name,
            GROUP_CONCAT(s.speciality_name SEPARATOR ', ') AS specialities
     FROM employee_master e
     JOIN department d ON d.department_code = e.department_code
     LEFT JOIN employee_specialty es ON es.employee_id = e.employee_id
     LEFT JOIN speciality s ON s.speciality_code = es.speciality_code
     ${where}
     GROUP BY e.employee_id, d.department_name
     ORDER BY e.employee_id`,
    params
  );
  res.json(rows);
}));

// GET /api/employees/1
router.get('/:id', asyncHandler(async (req, res) => {
  const [[emp]] = await pool.query(
    `SELECT e.employee_id, e.first_name, e.last_name, e.email, e.phone, e.role, e.hire_date,
            e.department_code, d.department_name
     FROM employee_master e
     JOIN department d ON d.department_code = e.department_code
     WHERE e.employee_id = ?`, [req.params.id]);
  if (!emp) throw httpError(404, 'Employee not found');

  const [specialities] = await pool.query(
    `SELECT s.speciality_code, s.speciality_name
     FROM employee_specialty es JOIN speciality s ON s.speciality_code = es.speciality_code
     WHERE es.employee_id = ?`, [req.params.id]);

  res.json({ ...emp, specialities });
}));

// POST /api/employees
router.post('/', asyncHandler(async (req, res) => {
  required(req.body, ['first_name', 'last_name', 'email', 'role', 'hire_date', 'department_code']);
  const cols = FIELDS.filter((f) => req.body[f] !== undefined);
  const [result] = await pool.query(
    `INSERT INTO employee_master (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`,
    cols.map((c) => req.body[c])
  );
  res.status(201).json({ employee_id: result.insertId, message: 'Employee added' });
}));

// PUT /api/employees/1
router.put('/:id', asyncHandler(async (req, res) => {
  const { setClause, values } = buildUpdate(req.body, FIELDS);
  const [result] = await pool.query(
    `UPDATE employee_master SET ${setClause} WHERE employee_id = ?`, [...values, req.params.id]);
  if (!result.affectedRows) throw httpError(404, 'Employee not found');
  res.json({ message: 'Employee updated' });
}));

// DELETE /api/employees/1
router.delete('/:id', asyncHandler(async (req, res) => {
  const [result] = await pool.query('DELETE FROM employee_master WHERE employee_id = ?', [req.params.id]);
  if (!result.affectedRows) throw httpError(404, 'Employee not found');
  res.json({ message: 'Employee deleted' });
}));

// ---------- Specialities (bridge table) ----------
router.post('/:id/specialities', asyncHandler(async (req, res) => {
  required(req.body, ['speciality_code']);
  await pool.query(
    'INSERT INTO employee_specialty (employee_id, speciality_code) VALUES (?, ?)',
    [req.params.id, req.body.speciality_code]);
  res.status(201).json({ message: 'Speciality assigned' });
}));

router.delete('/:id/specialities/:code', asyncHandler(async (req, res) => {
  const [result] = await pool.query(
    'DELETE FROM employee_specialty WHERE employee_id = ? AND speciality_code = ?',
    [req.params.id, req.params.code]);
  if (!result.affectedRows) throw httpError(404, 'Mapping not found');
  res.json({ message: 'Speciality removed' });
}));

// ---------- Paychecks ----------
router.get('/:id/paychecks', asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT paycheck_id, pay_date, basic_salary, bonus, deductions,
            (basic_salary + bonus - deductions) AS net_pay
     FROM employees_paycheck WHERE employee_id = ? ORDER BY pay_date DESC`, [req.params.id]);
  res.json(rows);
}));

router.post('/:id/paychecks', asyncHandler(async (req, res) => {
  required(req.body, ['pay_date', 'basic_salary']);
  const { pay_date, basic_salary, bonus = 0, deductions = 0 } = req.body;
  const [result] = await pool.query(
    `INSERT INTO employees_paycheck (employee_id, pay_date, basic_salary, bonus, deductions)
     VALUES (?, ?, ?, ?, ?)`,
    [req.params.id, pay_date, basic_salary, bonus, deductions]);
  res.status(201).json({ paycheck_id: result.insertId, message: 'Paycheck recorded' });
}));

module.exports = router;