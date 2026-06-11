// ============================================================
// routes/tickets.js - Endpoint Pembelian Tiket
// ============================================================
const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// ---- GET /api/tickets/my ----
// Tiket milik user yang sedang login
router.get('/my', requireAuth, async (req, res) => {
  try {
    const [tickets] = await db.query(
      `SELECT t.*,
              m.poster AS movie_poster,
              c.name AS cinema_name,
              s.name AS studio_name,
              GROUP_CONCAT(ts.seat_number ORDER BY ts.seat_number SEPARATOR ',') AS seat_numbers_str
       FROM tickets t
       LEFT JOIN movies m  ON t.movie_id = m.id
       LEFT JOIN cinemas c ON t.cinema_id = c.id
       LEFT JOIN studios s ON t.studio_id = s.id
       LEFT JOIN ticket_seats ts ON ts.ticket_id = t.id
       WHERE t.user_id = ?
       GROUP BY t.id
       ORDER BY t.purchase_date DESC`,
      [req.user.id]
    );

    const result = tickets.map(t => ({
      ...t,
      showtime:    t.showtime    ? String(t.showtime).substring(0, 5) : t.showtime,
      seatNumbers: t.seat_numbers_str ? t.seat_numbers_str.split(',') : [],
      totalPrice:  t.total_price,
      movieTitle:  t.movie_title,
      moviePoster: t.movie_poster,
      purchaseDate: t.purchase_date,
      cinemaName:  t.cinema_name || 'Grand Indonesia XXI',
      studioName:  t.studio_name || 'Studio 1',
      // camelCase aliases
      movieId:    t.movie_id,
      userId:     t.user_id,
      cinemaId:   t.cinema_id,
      studioId:   t.studio_id
    }));

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[tickets/my]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---- GET /api/tickets/all (admin) ----
router.get('/all', requireAdmin, async (req, res) => {
  try {
    const [tickets] = await db.query(
      `SELECT t.*,
              m.poster AS movie_poster,
              u.name AS user_name,
              c.name AS cinema_name,
              s.name AS studio_name,
              GROUP_CONCAT(ts.seat_number ORDER BY ts.seat_number SEPARATOR ',') AS seat_numbers_str
       FROM tickets t
       LEFT JOIN movies m        ON t.movie_id = m.id
       LEFT JOIN users u         ON u.id  = t.user_id
       LEFT JOIN cinemas c       ON t.cinema_id = c.id
       LEFT JOIN studios s       ON t.studio_id = s.id
       LEFT JOIN ticket_seats ts ON ts.ticket_id = t.id
       GROUP BY t.id
       ORDER BY t.purchase_date DESC`
    );

    const result = tickets.map(t => ({
      ...t,
      showtime:    t.showtime ? String(t.showtime).substring(0, 5) : t.showtime,
      seatNumbers: t.seat_numbers_str ? t.seat_numbers_str.split(',') : [],
      totalPrice:  t.total_price,
      movieTitle:  t.movie_title,
      moviePoster: t.movie_poster,
      purchaseDate: t.purchase_date,
      cinemaName:  t.cinema_name || 'Grand Indonesia XXI',
      studioName:  t.studio_name || 'Studio 1',
      userId:      t.user_id,
      userName:    t.user_name,
      movieId:     t.movie_id,
      cinemaId:    t.cinema_id,
      studioId:    t.studio_id
    }));

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[tickets/all]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---- GET /api/tickets/occupied-seats ----
// Mengambil nomor kursi yang sudah dipesan untuk jadwal tertentu
router.get('/occupied-seats', async (req, res) => {
  try {
    const { movieId, date, showtime, studioId, cinemaId } = req.query;
    if (!movieId || !date || !showtime || !studioId || !cinemaId) {
      return res.status(400).json({ success: false, error: 'Parameter movieId, date, showtime, studioId, dan cinemaId diperlukan.' });
    }

    const [rows] = await db.query(
      `SELECT ts.seat_number
       FROM ticket_seats ts
       JOIN tickets t ON ts.ticket_id = t.id
       WHERE t.movie_id = ?
         AND t.show_date = ?
         AND TIME_FORMAT(t.showtime, '%H:%i') = TIME_FORMAT(?, '%H:%i')
         AND t.studio_id = ?
         AND t.cinema_id = ?
         AND t.status IN ('confirmed', 'pending')`,
      [movieId, date, showtime, studioId, cinemaId]
    );

    const seats = rows.map(r => r.seat_number);
    res.json({ success: true, data: seats });
  } catch (err) {
    console.error('[tickets/occupied-seats]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---- POST /api/tickets/buy ----
// Beli tiket baru (user login)
router.post('/buy', requireAuth, async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { movieId, showtime, date, seats, seatNumbers, cinemaId, studioId } = req.body;
    const userId = req.user.id;

    if (!movieId || !showtime || !date || !seats || !cinemaId || !studioId)
      return res.status(400).json({ success: false, error: 'Data pembelian tidak lengkap.' });

    // Ambil data film untuk price & title
    const [movieRows] = await conn.query(
      'SELECT id, title, poster, price FROM movies WHERE id = ?',
      [movieId]
    );
    if (!movieRows.length)
      return res.status(404).json({ success: false, error: 'Film tidak ditemukan.' });

    const movie      = movieRows[0];
    const totalPrice = movie.price * seats;
    const ticketId   = 'TIX' + Date.now();

    await conn.beginTransaction();

    // Cek double booking
    if (seatNumbers && seatNumbers.length) {
      const [existingSeats] = await conn.query(
        `SELECT ts.seat_number 
         FROM ticket_seats ts
         JOIN tickets t ON ts.ticket_id = t.id
         WHERE t.movie_id = ? 
           AND t.show_date = ? 
           AND TIME_FORMAT(t.showtime, '%H:%i') = TIME_FORMAT(?, '%H:%i')
           AND t.studio_id = ? 
           AND t.cinema_id = ?
           AND t.status IN ('confirmed', 'pending')
           AND ts.seat_number IN (?)`,
        [movieId, date, showtime, studioId, cinemaId, seatNumbers]
      );

      if (existingSeats.length > 0) {
        await conn.rollback();
        const taken = existingSeats.map(s => s.seat_number).join(', ');
        return res.status(409).json({ 
          success: false, 
          error: `Kursi berikut sudah dipesan: ${taken}. Silakan pilih kursi lain.` 
        });
      }
    }

    await conn.query(
      `INSERT INTO tickets
         (id, user_id, movie_id, cinema_id, studio_id, movie_title, movie_poster, showtime, show_date, seats, total_price, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')`,
      [ticketId, userId, movieId, cinemaId, studioId, movie.title, null, showtime, date, seats, totalPrice]
    );

    // Simpan nomor kursi
    if (seatNumbers && seatNumbers.length) {
      for (const seat of seatNumbers) {
        await conn.query(
          'INSERT INTO ticket_seats (ticket_id, seat_number) VALUES (?, ?)',
          [ticketId, seat]
        );
      }
    }

    await conn.commit();

    res.status(201).json({
      success: true,
      data: {
        id:          ticketId,
        userId,
        movieId,
        cinemaId,
        studioId,
        movieTitle:  movie.title,
        moviePoster: movie.poster,
        showtime,
        date,
        seats,
        seatNumbers: seatNumbers || [],
        totalPrice,
        status:      'confirmed',
        purchaseDate: new Date().toISOString()
      }
    });
  } catch (err) {
    try {
      await conn.rollback();
    } catch (rollbackErr) {
      console.error('Error rolling back transaction:', rollbackErr);
    }
    console.error('[tickets/buy]', err);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    try {
      conn.release();
    } catch (releaseErr) {
      console.error('Error releasing connection:', releaseErr);
    }
  }
});

module.exports = router;
