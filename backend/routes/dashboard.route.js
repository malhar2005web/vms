const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { protectRoute } = require('../middleware/auth');

// All dashboard endpoints are protected
router.use(protectRoute);

// GET /api/dashboard/stats
router.get('/stats', async (req, res) => {
  try {
    // 1. Core counters
    const pendingCountRes = await query("SELECT COUNT(*) FROM visits WHERE status = 'Pending'");
    const activeCountRes = await query("SELECT COUNT(*) FROM visits WHERE status = 'Approved' AND out_time IS NULL");
    const completedTodayRes = await query(`
      SELECT COUNT(*) FROM visits 
      WHERE status = 'Completed' AND out_time >= CURRENT_DATE
    `);
    const rejectedTodayRes = await query(`
      SELECT COUNT(*) FROM visits 
      WHERE status = 'Rejected' AND created_at >= CURRENT_DATE
    `);

    // 2. Department-wise count
    const deptDistributionRes = await query(`
      SELECT d.name as name, COUNT(v.id) as value
      FROM visits v
      JOIN departments d ON v.department_id = d.id
      GROUP BY d.name
    `);

    // 3. Purpose distribution
    const purposeDistributionRes = await query(`
      SELECT p.name as name, COUNT(v.id) as value
      FROM visits v
      JOIN purposes p ON v.purpose_id = p.id
      GROUP BY p.name
    `);

    // 4. Units stats
    const unitStatsRes = await query(`
      SELECT u.name as name, COUNT(v.id) as total_visits,
             COUNT(CASE WHEN v.status = 'Approved' AND v.out_time IS NULL THEN 1 END) as inside_now
      FROM units u
      LEFT JOIN visits v ON v.unit_id = u.id
      GROUP BY u.name
    `);

    res.json({
      success: true,
      data: {
        counters: {
          pending: parseInt(pendingCountRes.rows[0].count, 10),
          inside: parseInt(activeCountRes.rows[0].count, 10),
          completed_today: parseInt(completedTodayRes.rows[0].count, 10),
          rejected_today: parseInt(rejectedTodayRes.rows[0].count, 10)
        },
        deptDistribution: deptDistributionRes.rows,
        purposeDistribution: purposeDistributionRes.rows,
        unitDistribution: unitStatsRes.rows
      }
    });
  } catch (error) {
    console.error('Error generating dashboard stats:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// GET /api/dashboard/emergency
router.get('/emergency', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        v.id, v.in_time, v.notes,
        vis.name as visitor_name, vis.mobile as visitor_mobile, vis.company as visitor_company,
        u.name as unit_name,
        d.name as department_name,
        e.name as employee_name
      FROM visits v
      JOIN visitors vis ON v.visitor_id = vis.id
      LEFT JOIN units u ON v.unit_id = u.id
      LEFT JOIN departments d ON v.department_id = d.id
      LEFT JOIN employees e ON v.employee_id = e.id
      WHERE v.status = 'Approved' AND v.out_time IS NULL
      ORDER BY v.in_time DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching emergency list:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

module.exports = router;
