// ============================================================
// routes/auth.js - Endpoint Autentikasi
// ============================================================
const express = require('express');
const bcrypt  = require('bcryptjs');
const router  = express.Router();
const db      = require('../db');
const { requireAuth, generateToken } = require('../middleware/auth');

// ---- POST /api/auth/register ----
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ success: false, error: 'Semua field wajib diisi.' });
    if (name.length < 2)
      return res.status(400).json({ success: false, error: 'Nama minimal 2 karakter.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ success: false, error: 'Format email tidak valid.' });
    if (password.length < 6)
      return res.status(400).json({ success: false, error: 'Password minimal 6 karakter.' });

    // Cek email sudah ada
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0)
      return res.status(409).json({ success: false, error: 'Email sudah terdaftar.' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const avatar = name.charAt(0).toUpperCase();

    const [result] = await db.query(
      'INSERT INTO users (name, email, password, role, avatar) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, 'user', avatar]
    );

    const user = { id: result.insertId, name, email, role: 'user', avatar };
    const token = generateToken(user);

    res.status(201).json({ success: true, user, token });
  } catch (err) {
    console.error('[register]', err);
    res.status(500).json({ success: false, error: 'Terjadi kesalahan server.' });
  }
});

// ---- POST /api/auth/login ----
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ success: false, error: 'Email dan password wajib diisi.' });

    // Cek admin hardcoded
    const ADMIN_EMAIL    = 'admin@cinemax.com';
    const ADMIN_PASSWORD = 'Admin@123';
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const user  = { id: 1, name: 'Admin', email: ADMIN_EMAIL, role: 'admin', avatar: 'A' };
      const token = generateToken(user);
      return res.json({ success: true, user, token });
    }

    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!rows.length)
      return res.status(401).json({ success: false, error: 'Email atau password salah.' });

    const dbUser  = rows[0];
    const isMatch = await bcrypt.compare(password, dbUser.password);
    if (!isMatch)
      return res.status(401).json({ success: false, error: 'Email atau password salah.' });

    const user  = { id: dbUser.id, name: dbUser.name, email: dbUser.email, role: dbUser.role, avatar: dbUser.avatar };
    const token = generateToken(user);

    res.json({ success: true, user, token });
  } catch (err) {
    console.error('[login]', err);
    res.status(500).json({ success: false, error: 'Terjadi kesalahan server.' });
  }
});

// ---- GET /api/auth/me ----
router.get('/me', requireAuth, (req, res) => {
  res.json({ success: true, user: req.user });
});

module.exports = router;
