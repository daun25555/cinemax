// ============================================================
// routes/cinemas.js - Endpoint Bioskop & Ruangan (Studio)
// ============================================================
const express = require('express');
const router  = express.Router();
const db      = require('../db');

// ---- GET /api/cinemas ----
// Mengambil daftar seluruh bioskop beserta studionya
router.get('/', async (req, res) => {
  try {
    const [cinemas] = await db.query('SELECT * FROM cinemas');
    const [studios] = await db.query('SELECT * FROM studios');

    const result = cinemas.map(c => ({
      id: c.id,
      name: c.name,
      address: c.address,
      studios: studios
        .filter(s => s.cinema_id === c.id)
        .map(s => ({
          id: s.id,
          name: s.name,
          capacity: s.capacity
        }))
    }));

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[cinemas/all]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---- GET /api/cinemas/:id/showtimes/:movieId ----
// Mengambil jadwal tayang film tertentu di bioskop terpilih
router.get('/:id/showtimes/:movieId', async (req, res) => {
  try {
    const { movieId } = req.params;
    const [rows] = await db.query(
      `SELECT DISTINCT TIME_FORMAT(show_time, '%H:%i') AS time_str
       FROM showtimes
       WHERE movie_id = ?
       ORDER BY show_time`,
      [movieId]
    );

    const times = rows.map(r => r.time_str);
    res.json({ success: true, data: times });
  } catch (err) {
    console.error('[cinemas/showtimes]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
