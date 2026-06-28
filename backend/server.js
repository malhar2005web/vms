const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
require('dotenv').config();

// Routes
const authRoutes = require('./routes/auth.route');
const masterRoutes = require('./routes/masters.route');
const visitorRoutes = require('./routes/visitors.route');
const dashboardRoutes = require('./routes/dashboard.route');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: true, // Allow frontend origin
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/masters', masterRoutes);
app.use('/api/visitors', visitorRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Serve Frontend (Vite build)
app.use(express.static(path.join(__dirname, '../frontend/dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// Create HTTP + WebSocket Server
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const clients = new Set();

wss.on('connection', (ws) => {
  console.log('🔌 WebSocket Client connected');
  clients.add(ws);

  ws.on('close', () => {
    console.log('❌ WebSocket Client disconnected');
    clients.delete(ws);
  });

  ws.on('error', (err) => {
    console.error('WebSocket Error:', err);
  });
});

// Broadcast Helper (emulating Socket.io emit)
const broadcast = (event, data) => {
  const payload = JSON.stringify({ event, data });
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
};

// Expose broadcast to routes via app configuration
app.set('io', { emit: broadcast });

server.listen(PORT, () => {
  console.log(`🚀 Express server running on port ${PORT}`);
  console.log(`📡 WebSocket server initialized on port ${PORT}`);
});