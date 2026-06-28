const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { protectRoute } = require('../middleware/auth');

// ==========================================
// PUBLIC VISITOR ROUTE (NO AUTH)
// ==========================================

// GET /api/visitors/form-data - Fetch masters for registration form
router.get('/form-data', async (req, res) => {
  try {
    const units = await query('SELECT id, name FROM units ORDER BY name');
    const departments = await query('SELECT id, name FROM departments ORDER BY name');
    const employees = await query('SELECT id, name, department_id, unit_id FROM employees ORDER BY name');
    const gates = await query('SELECT id, name, unit_id FROM gates ORDER BY name');
    const purposes = await query('SELECT id, name FROM purposes ORDER BY name');

    res.json({
      success: true,
      data: {
        units: units.rows,
        departments: departments.rows,
        employees: employees.rows,
        gates: gates.rows,
        purposes: purposes.rows
      }
    });
  } catch (error) {
    console.error('Error fetching form data:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// POST /api/visitors/register - Visitor fills details on mobile
router.post('/register', async (req, res) => {
  const {
    name,
    mobile,
    company,
    address,
    city,
    email,
    department_id,
    employee_id,
    purpose_id,
    unit_id,
    gate_id,
    photo,      // Base64 encoded string
    signature   // Base64 encoded string
  } = req.body;

  if (!name || !mobile) {
    return res.status(400).json({ success: false, message: 'Name and mobile number are required' });
  }

  try {
    // 1. Insert or update visitor
    let visitorId;
    const visitorRes = await query('SELECT id FROM visitors WHERE mobile = $1', [mobile]);
    
    if (visitorRes.rows.length > 0) {
      visitorId = visitorRes.rows[0].id;
      // Update details
      await query(
        'UPDATE visitors SET name = $1, company = $2, address = $3, city = $4, email = $5 WHERE id = $6',
        [name, company, address, city, email, visitorId]
      );
    } else {
      const insertVisitorRes = await query(
        'INSERT INTO visitors (name, mobile, company, address, city, email) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
        [name, mobile, company, address, city, email]
      );
      visitorId = insertVisitorRes.rows[0].id;
    }

    // 2. Create visit
    const visitRes = await query(
      `INSERT INTO visits 
      (visitor_id, department_id, employee_id, purpose_id, unit_id, gate_id, photo, signature, status) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Pending') RETURNING *`,
      [
        visitorId,
        department_id || null,
        employee_id || null,
        purpose_id || null,
        unit_id || null,
        gate_id || null,
        photo || null,
        signature || null
      ]
    );

    const visitId = visitRes.rows[0].id;

    // 3. Fetch full details for realtime notification
    const fullVisitRes = await query(
      `SELECT 
        v.id, v.status, v.created_at, v.photo, v.signature, v.notes, v.in_time, v.out_time,
        vis.name as visitor_name, vis.mobile as visitor_mobile, vis.company as visitor_company,
        d.name as department_name,
        e.name as employee_name,
        p.name as purpose_name,
        u.name as unit_name,
        g.name as gate_name
      FROM visits v
      JOIN visitors vis ON v.visitor_id = vis.id
      LEFT JOIN departments d ON v.department_id = d.id
      LEFT JOIN employees e ON v.employee_id = e.id
      LEFT JOIN purposes p ON v.purpose_id = p.id
      LEFT JOIN units u ON v.unit_id = u.id
      LEFT JOIN gates g ON v.gate_id = g.id
      WHERE v.id = $1`,
      [visitId]
    );

    const fullVisitData = fullVisitRes.rows[0];

    // 4. Trigger Real-time WebSocket Alert to Dashboard
    const io = req.app.get('io');
    if (io) {
      io.emit('new_visitor_request', fullVisitData);
      console.log('Realtime notification sent for visit ID:', visitId);
    }

    res.status(201).json({
      success: true,
      message: 'Registration submitted successfully. Please wait for approval.',
      visitId: visitId
    });
  } catch (error) {
    console.error('Error during visitor registration:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// ==========================================
// ADMIN/STAFF PROTECTED ROUTES
// ==========================================
router.use(protectRoute);

// GET /api/visitors/visits - Get all visits
router.get('/visits', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        v.id, v.status, v.created_at, v.photo, v.signature, v.notes, v.in_time, v.out_time,
        vis.name as visitor_name, vis.mobile as visitor_mobile, vis.company as visitor_company,
        vis.address as visitor_address, vis.city as visitor_city, vis.email as visitor_email,
        d.name as department_name,
        e.name as employee_name,
        p.name as purpose_name,
        u.name as unit_name,
        g.name as gate_name
      FROM visits v
      JOIN visitors vis ON v.visitor_id = vis.id
      LEFT JOIN departments d ON v.department_id = d.id
      LEFT JOIN employees e ON v.employee_id = e.id
      LEFT JOIN purposes p ON v.purpose_id = p.id
      LEFT JOIN units u ON v.unit_id = u.id
      LEFT JOIN gates g ON v.gate_id = g.id
      ORDER BY v.id DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching visits:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// PUT /api/visitors/visits/:id/approve - Approve visitor check-in
router.put('/visits/:id/approve', async (req, res) => {
  const { id } = req.params;
  try {
    const checkRes = await query('SELECT status FROM visits WHERE id = $1', [id]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Visit request not found' });
    }

    const currentStatus = checkRes.rows[0].status;
    if (currentStatus !== 'Pending') {
      return res.status(400).json({ success: false, message: `Cannot approve. Current status is ${currentStatus}` });
    }

    const result = await query(
      `UPDATE visits 
       SET status = 'Approved', in_time = CURRENT_TIMESTAMP 
       WHERE id = $1 RETURNING *`,
      [id]
    );

    // Notify clients of update
    const io = req.app.get('io');
    if (io) {
      io.emit('visit_updated', { id, status: 'Approved' });
    }

    res.json({ success: true, message: 'Visit approved and Checked In.', data: result.rows[0] });
  } catch (error) {
    console.error('Error approving visit:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// PUT /api/visitors/visits/:id/reject - Reject visitor check-in
router.put('/visits/:id/reject', async (req, res) => {
  const { id } = req.params;
  try {
    const checkRes = await query('SELECT status FROM visits WHERE id = $1', [id]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Visit request not found' });
    }

    const currentStatus = checkRes.rows[0].status;
    if (currentStatus !== 'Pending') {
      return res.status(400).json({ success: false, message: `Cannot reject. Current status is ${currentStatus}` });
    }

    const result = await query(
      `UPDATE visits 
       SET status = 'Rejected' 
       WHERE id = $1 RETURNING *`,
      [id]
    );

    const io = req.app.get('io');
    if (io) {
      io.emit('visit_updated', { id, status: 'Rejected' });
    }

    res.json({ success: true, message: 'Visit request rejected.', data: result.rows[0] });
  } catch (error) {
    console.error('Error rejecting visit:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// PUT /api/visitors/visits/:id/checkout - Check out visitor (end visit)
router.put('/visits/:id/checkout', async (req, res) => {
  const { id } = req.params;
  try {
    const checkRes = await query('SELECT status FROM visits WHERE id = $1', [id]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Visit request not found' });
    }

    const currentStatus = checkRes.rows[0].status;
    if (currentStatus !== 'Approved') {
      return res.status(400).json({ success: false, message: `Cannot check out. Visit status is ${currentStatus}` });
    }

    const result = await query(
      `UPDATE visits 
       SET status = 'Completed', out_time = CURRENT_TIMESTAMP 
       WHERE id = $1 RETURNING *`,
      [id]
    );

    const io = req.app.get('io');
    if (io) {
      io.emit('visit_updated', { id, status: 'Completed' });
    }

    res.json({ success: true, message: 'Visitor checked out successfully.', data: result.rows[0] });
  } catch (error) {
    console.error('Error checking out visit:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// PUT /api/visitors/visits/:id/notes - Add/edit visit notes
router.put('/visits/:id/notes', async (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;
  try {
    const result = await query(
      `UPDATE visits 
       SET notes = $1 
       WHERE id = $2 RETURNING *`,
      [notes, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Visit not found' });
    }
    res.json({ success: true, message: 'Notes updated successfully.', data: result.rows[0] });
  } catch (error) {
    console.error('Error updating visit notes:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

module.exports = router;
