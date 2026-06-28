const jwt = require('jsonwebtoken');
const { query } = require('../db');

const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies['vms-jwt'];
    if (!token) {
      return res.status(401).json({ success: false, message: 'Unauthorized - No Token Provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'visitor_management_secret_key_2026');
    if (!decoded) {
      return res.status(401).json({ success: false, message: 'Unauthorized - Invalid Token' });
    }

    const userRes = await query('SELECT id, username, role FROM users WHERE id = $1', [decoded.userId]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    req.user = userRes.rows[0];
    next();
  } catch (error) {
    console.error('Error in auth middleware:', error.message);
    return res.status(401).json({ success: false, message: 'Unauthorized - Invalid Session' });
  }
};

module.exports = { protectRoute };
