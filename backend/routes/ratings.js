// ============================================================
// routes/ratings.js - Endpoint Penilaian & Ulasan Film
// ============================================================
const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// ---- GET /api/ratings/movie/:movieId ----
// Ambil semua rating untuk sebuah film
router.get('/movie/:movieId', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT r.*, u.name AS user_name, u.avatar
       FROM ratings r
       LEFT JOIN users u ON u.id = r.user_id
       WHERE r.movie_id = ?
       ORDER BY r.created_at DESC`,
      [req.params.movieId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[ratings/movie]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---- GET /api/ratings/my ----
// Ambil semua rating milik user yang login
router.get('/my', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT r.*, m.title AS movie_title, m.poster AS movie_poster
       FROM ratings r
       JOIN movies m ON m.id = r.movie_id
       WHERE r.user_id = ?
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[ratings/my]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---- GET /api/ratings/user/:movieId ----
// Ambil rating milik user yang login untuk film tertentu
router.get('/user/:movieId', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM ratings WHERE user_id = ? AND movie_id = ?',
      [req.user.id, req.params.movieId]
    );
    res.json({ success: true, data: rows[0] || null });
  } catch (err) {
    console.error('[ratings/user]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---- POST /api/ratings ----
// Tambah atau update rating (1 user = 1 rating per film)
router.post('/', requireAuth, async (req, res) => {
  try {
    const { movieId, rating, review } = req.body;
    const userId = req.user.id;

    if (!movieId || !rating)
      return res.status(400).json({ success: false, error: 'movieId dan rating wajib diisi.' });
    if (rating < 1 || rating > 5)
      return res.status(400).json({ success: false, error: 'Rating harus antara 1 sampai 5.' });

    // Cek apakah sudah pernah rating film ini
    const [existing] = await db.query(
      'SELECT id FROM ratings WHERE user_id = ? AND movie_id = ?',
      [userId, movieId]
    );

    if (existing.length > 0) {
      // Update rating yang sudah ada
      await db.query(
        'UPDATE ratings SET rating = ?, review = ?, user_name = ?, updated_at = NOW() WHERE user_id = ? AND movie_id = ?',
        [rating, review || '', req.user.name, userId, movieId]
      );
    } else {
      // Insert rating baru
      await db.query(
        'INSERT INTO ratings (user_id, movie_id, rating, review, user_name) VALUES (?, ?, ?, ?, ?)',
        [userId, movieId, rating, review || '', req.user.name]
      );
    }

    const [rows] = await db.query(
      'SELECT * FROM ratings WHERE user_id = ? AND movie_id = ?',
      [userId, movieId]
    );

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[ratings/add]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---- GET /api/ratings/all (admin) ----
router.get('/all', requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT r.*, m.title AS movie_title
       FROM ratings r
       LEFT JOIN movies m ON m.id = r.movie_id
       ORDER BY r.created_at DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[ratings/all]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
