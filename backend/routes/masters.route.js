const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { query } = require('../db');
const { protectRoute } = require('../middleware/auth');

// All master routes are protected by admin login
router.use(protectRoute);

// ==========================================
// UNITS CRUD
// ==========================================
router.get('/units', async (req, res) => {
  try {
    const result = await query('SELECT * FROM units ORDER BY id DESC');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching units:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

router.post('/units', async (req, res) => {
  const { name, address } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Name is required' });
  try {
    const result = await query('INSERT INTO units (name, address) VALUES ($1, $2) RETURNING *', [name, address]);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error creating unit:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

router.put('/units/:id', async (req, res) => {
  const { id } = req.params;
  const { name, address } = req.body;
  try {
    const result = await query('UPDATE units SET name = $1, address = $2 WHERE id = $3 RETURNING *', [name, address, id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Unit not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error updating unit:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

router.delete('/units/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query('DELETE FROM units WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Unit not found' });
    res.json({ success: true, message: 'Unit deleted successfully' });
  } catch (error) {
    console.error('Error deleting unit:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// ==========================================
// DEPARTMENTS CRUD
// ==========================================
router.get('/departments', async (req, res) => {
  try {
    const result = await query('SELECT * FROM departments ORDER BY id DESC');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

router.post('/departments', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Name is required' });
  try {
    const result = await query('INSERT INTO departments (name) VALUES ($1) RETURNING *', [name]);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error creating department:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

router.put('/departments/:id', async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  try {
    const result = await query('UPDATE departments SET name = $1 WHERE id = $2 RETURNING *', [name, id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Department not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error updating department:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

router.delete('/departments/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query('DELETE FROM departments WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Department not found' });
    res.json({ success: true, message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Error deleting department:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// ==========================================
// EMPLOYEES CRUD
// ==========================================
router.get('/employees', async (req, res) => {
  try {
    const result = await query(`
      SELECT e.*, d.name as department_name, u.name as unit_name 
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN units u ON e.unit_id = u.id
      ORDER BY e.id DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

router.post('/employees', async (req, res) => {
  const { name, email, phone, department_id, unit_id } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Name is required' });
  try {
    const result = await query(
      'INSERT INTO employees (name, email, phone, department_id, unit_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, email, phone, department_id || null, unit_id || null]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

router.put('/employees/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, department_id, unit_id } = req.body;
  try {
    const result = await query(
      'UPDATE employees SET name = $1, email = $2, phone = $3, department_id = $4, unit_id = $5 WHERE id = $6 RETURNING *',
      [name, email, phone, department_id || null, unit_id || null, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Employee not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

router.delete('/employees/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query('DELETE FROM employees WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Employee not found' });
    res.json({ success: true, message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// ==========================================
// GATES CRUD
// ==========================================
router.get('/gates', async (req, res) => {
  try {
    const result = await query(`
      SELECT g.*, u.name as unit_name 
      FROM gates g
      LEFT JOIN units u ON g.unit_id = u.id
      ORDER BY g.id DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching gates:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

router.post('/gates', async (req, res) => {
  const { name, unit_id } = req.body;
  if (!name || !unit_id) return res.status(400).json({ success: false, message: 'Name and Unit ID are required' });
  try {
    const result = await query('INSERT INTO gates (name, unit_id) VALUES ($1, $2) RETURNING *', [name, unit_id]);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error creating gate:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

router.put('/gates/:id', async (req, res) => {
  const { id } = req.params;
  const { name, unit_id } = req.body;
  try {
    const result = await query('UPDATE gates SET name = $1, unit_id = $2 WHERE id = $3 RETURNING *', [name, unit_id, id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Gate not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error updating gate:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

router.delete('/gates/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query('DELETE FROM gates WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Gate not found' });
    res.json({ success: true, message: 'Gate deleted successfully' });
  } catch (error) {
    console.error('Error deleting gate:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// ==========================================
// PURPOSES CRUD
// ==========================================
router.get('/purposes', async (req, res) => {
  try {
    const result = await query('SELECT * FROM purposes ORDER BY id DESC');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching purposes:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

router.post('/purposes', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Name is required' });
  try {
    const result = await query('INSERT INTO purposes (name) VALUES ($1) RETURNING *', [name]);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error creating purpose:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

router.put('/purposes/:id', async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  try {
    const result = await query('UPDATE purposes SET name = $1 WHERE id = $2 RETURNING *', [name, id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Purpose not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error updating purpose:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

router.delete('/purposes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query('DELETE FROM purposes WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Purpose not found' });
    res.json({ success: true, message: 'Purpose deleted successfully' });
  } catch (error) {
    console.error('Error deleting purpose:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// ==========================================
// SUB-USERS CRUD
// ==========================================
router.get('/users', async (req, res) => {
  try {
    const result = await query('SELECT id, username, role, created_at FROM users ORDER BY id DESC');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

router.post('/users', async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password) return res.status(400).json({ success: false, message: 'Username and password are required' });
  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await query(
      'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING id, username, role, created_at',
      [username, hash, role || 'admin']
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error creating user:', error);
    if (error.code === '23505') {
      return res.status(400).json({ success: false, message: 'Username already exists' });
    }
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

router.put('/users/:id', async (req, res) => {
  const { id } = req.params;
  const { username, password, role } = req.body;
  try {
    let result;
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      result = await query(
        'UPDATE users SET username = $1, role = $2, password_hash = $3 WHERE id = $4 RETURNING id, username, role, created_at',
        [username, role, hash, id]
      );
    } else {
      result = await query(
        'UPDATE users SET username = $1, role = $2 WHERE id = $3 RETURNING id, username, role, created_at',
        [username, role, id]
      );
    }
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

router.delete('/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

module.exports = router;
