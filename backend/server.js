// ============================================================
// server.js - CineMax Backend Server (with real-time seat booking)
// ============================================================
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const http    = require('http');
const { WebSocketServer } = require('ws');
require('dotenv').config();

const app    = express();
const server = http.createServer(app);
const PORT   = process.env.PORT || 3000;

// ---- Middleware ----
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ---- Sajikan file HTML frontend (folder parent = cinemax/) ----
app.use(express.static(path.join(__dirname, '..')));

// ---- API Routes ----
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/movies',   require('./routes/movies'));
app.use('/api/ratings',  require('./routes/ratings'));
app.use('/api/tickets',  require('./routes/tickets'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/cinemas',  require('./routes/cinemas'));
app.use('/api/admin',    require('./routes/admin'));
app.use('/api/watchlist',require('./routes/watchlist'));

// ---- Health check ----
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: '🎬 CineMax API berjalan dengan baik!', time: new Date() });
});

// ---- Catch-all ----
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
  }
});

// ============================================================
// WebSocket Server - Real-time Seat Booking
// seatLocks: Map<sessionKey, Map<seatId, {userId, clientId, expireAt}>>
// ============================================================
const wss = new WebSocketServer({ server });

const seatLocks = new Map();
const LOCK_TTL_MS = 5 * 60 * 1000; // 5 menit

function cleanExpiredLocks(sessionKey) {
  const locks = seatLocks.get(sessionKey);
  if (!locks) return;
  const now = Date.now();
  for (const [seat, info] of locks) {
    if (info.expireAt < now) locks.delete(seat);
  }
  if (locks.size === 0) seatLocks.delete(sessionKey);
}

function getLockedSeats(sessionKey) {
  cleanExpiredLocks(sessionKey);
  const locks = seatLocks.get(sessionKey);
  if (!locks) return {};
  const out = {};
  for (const [seat, info] of locks) {
    out[seat] = { userId: info.userId, clientId: info.clientId };
  }
  return out;
}

function broadcast(sessionKey, message, exceptClientId) {
  const msg = JSON.stringify(message);
  wss.clients.forEach(client => {
    if (client.readyState === 1 && client.sessionKey === sessionKey && client.clientId !== exceptClientId) {
      client.send(msg);
    }
  });
}

wss.on('connection', (ws) => {
  ws.clientId = Math.random().toString(36).substring(2);
  ws.sessionKey = null;
  ws.userId = null;

  ws.on('message', (rawData) => {
    let data;
    try { data = JSON.parse(rawData); } catch { return; }

    const { type, sessionKey, seatId, userId, seats } = data;

    if (type === 'join') {
      ws.sessionKey = sessionKey;
      ws.userId = userId;
      ws.send(JSON.stringify({
        type: 'state',
        locked: getLockedSeats(sessionKey)
      }));
    }

    else if (type === 'lock') {
      if (!ws.sessionKey) return;
      cleanExpiredLocks(ws.sessionKey);
      let locks = seatLocks.get(ws.sessionKey);
      if (!locks) { locks = new Map(); seatLocks.set(ws.sessionKey, locks); }

      const existing = locks.get(seatId);
      if (existing && existing.clientId !== ws.clientId) {
        ws.send(JSON.stringify({ type: 'lock_denied', seatId }));
        return;
      }

      locks.set(seatId, {
        userId: ws.userId,
        clientId: ws.clientId,
        expireAt: Date.now() + LOCK_TTL_MS
      });

      broadcast(ws.sessionKey, {
        type: 'locked',
        seatId,
        userId: ws.userId,
        clientId: ws.clientId
      }, ws.clientId);
    }

    else if (type === 'unlock') {
      if (!ws.sessionKey) return;
      const locks = seatLocks.get(ws.sessionKey);
      if (locks) {
        const existing = locks.get(seatId);
        if (existing && existing.clientId === ws.clientId) {
          locks.delete(seatId);
          broadcast(ws.sessionKey, { type: 'unlocked', seatId }, ws.clientId);
        }
      }
    }

    else if (type === 'confirm') {
      if (!ws.sessionKey) return;
      const locks = seatLocks.get(ws.sessionKey);
      if (locks && seats) {
        seats.forEach(s => locks.delete(s));
      }
      broadcast(ws.sessionKey, { type: 'booked', seats, userId: ws.userId });
      ws.send(JSON.stringify({ type: 'booked', seats, userId: ws.userId }));
    }
  });

  ws.on('close', () => {
    if (!ws.sessionKey) return;
    const locks = seatLocks.get(ws.sessionKey);
    if (locks) {
      const toUnlock = [];
      for (const [seat, info] of locks) {
        if (info.clientId === ws.clientId) {
          locks.delete(seat);
          toUnlock.push(seat);
        }
      }
      if (toUnlock.length) {
        broadcast(ws.sessionKey, { type: 'unlocked_many', seats: toUnlock });
      }
    }
  });
});

// ---- Start Server ----
server.listen(PORT, () => {
  console.log('');
  console.log('🎬 ================================');
  console.log(`   CineMax Server AKTIF`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`   🔴 WebSocket AKTIF (real-time seat)`);
  console.log('🎬 ================================');
  console.log('');
});
