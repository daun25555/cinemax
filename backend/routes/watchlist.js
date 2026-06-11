// ============================================================
// routes/watchlist.js - Endpoint Watchlist / Wishlist
// ============================================================
const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { requireAuth } = require('../middleware/auth');

// ---- GET /api/watchlist/my ----
// Mengambil daftar film yang ada di watchlist user
router.get('/my', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await db.query(
      `SELECT movie_id, added_at
       FROM watchlist
       WHERE user_id = ?
       ORDER BY added_at DESC`,
      [userId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[watchlist/my]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---- POST /api/watchlist/toggle ----
// Menambahkan atau menghapus film dari watchlist
router.post('/toggle', requireAuth, async (req, res) => {
  try {
    const { movieId } = req.body;
    const userId = req.user.id;

    if (!movieId) {
      return res.status(400).json({ success: false, error: 'movieId wajib disertakan.' });
    }

    // Cek apakah sudah ada di watchlist
    const [existing] = await db.query(
      'SELECT id FROM watchlist WHERE user_id = ? AND movie_id = ?',
      [userId, movieId]
    );

    if (existing.length > 0) {
      // Sudah ada, maka hapus (Remove)
      await db.query('DELETE FROM watchlist WHERE id = ?', [existing[0].id]);
      return res.json({ success: true, action: 'removed', message: 'Dihapus dari wishlist' });
    } else {
      // Belum ada, maka tambahkan (Add)
      await db.query(
        'INSERT INTO watchlist (user_id, movie_id) VALUES (?, ?)',
        [userId, movieId]
      );
      return res.status(201).json({ success: true, action: 'added', message: 'Ditambahkan ke wishlist' });
    }
  } catch (err) {
    console.error('[watchlist/toggle]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---- GET /api/watchlist/check/:movieId ----
// Mengecek apakah sebuah film ada di watchlist user
router.get('/check/:movieId', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const movieId = req.params.movieId;

    const [existing] = await db.query(
      'SELECT id FROM watchlist WHERE user_id = ? AND movie_id = ?',
      [userId, movieId]
    );

    res.json({ success: true, inWatchlist: existing.length > 0 });
  } catch (err) {
    console.error('[watchlist/check]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
