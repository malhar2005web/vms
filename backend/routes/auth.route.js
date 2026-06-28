const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../db');
const { protectRoute } = require('../middleware/auth');

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required' });
  }

  try {
    const userRes = await query('SELECT * FROM users WHERE username = $1', [username]);
    if (userRes.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = userRes.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'visitor_management_secret_key_2026',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.cookie('vms-jwt', token, {
      maxAge: 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: 'strict',
      secure: false
    });

    res.json({
      success: true,
      message: 'Login successful',
      user: { id: user.id, username: user.username, role: user.role }
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('vms-jwt');
  res.json({ success: true, message: 'Logged out successfully' });
});

router.get('/me', protectRoute, (req, res) => {
  res.json({ success: true, user: req.user });
});

module.exports = router;
