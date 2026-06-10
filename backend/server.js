// ============================================================
// server.js - CineMax Backend Server
// ============================================================
const express = require('express');
const cors    = require('cors');
const path    = require('path');
require('dotenv').config();

const app  = express();
const PORT = process.env.PORT || 3000;

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

// ---- Health check ----
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: '🎬 CineMax API berjalan dengan baik!', time: new Date() });
});

// ---- Catch-all: kirim index.html untuk client-side routing ----
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
  }
});

// ---- Start Server ----
app.listen(PORT, () => {
  console.log('');
  console.log('🎬 ================================');
  console.log(`   CineMax Server AKTIF`);
  console.log(`   http://localhost:${PORT}`);
  console.log('🎬 ================================');
  console.log('');
});
