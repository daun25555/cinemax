// ============================================================
// routes/movies.js - Endpoint Data Film
// ============================================================
const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Helper: ambil film lengkap dengan genres, cast, showtimes, avg rating
async function fetchMovies(whereClause = '', params = []) {
  const [rows] = await db.query(`
    SELECT
      m.id, m.title, m.year, m.duration,
      CAST(m.rating AS DECIMAL(3,1)) AS rating,
      m.price, m.description, m.poster, m.backdrop,
      m.trailer, m.director, m.featured, m.now_playing,
      m.created_at,
      GROUP_CONCAT(DISTINCT g.name   ORDER BY g.name          SEPARATOR '||') AS genre_names,
      GROUP_CONCAT(DISTINCT mc.actor_name ORDER BY mc.cast_order SEPARATOR '||') AS cast_names,
      GROUP_CONCAT(DISTINCT TIME_FORMAT(s.show_time,'%H:%i') ORDER BY s.show_time SEPARATOR '||') AS showtime_list,
      ROUND(AVG(r.rating), 1) AS avg_user_rating,
      COUNT(DISTINCT r.id)    AS review_count
    FROM movies m
    LEFT JOIN movie_genres mg ON mg.movie_id = m.id
    LEFT JOIN genres g        ON g.id = mg.genre_id
    LEFT JOIN movie_cast mc   ON mc.movie_id = m.id
    LEFT JOIN showtimes s     ON s.movie_id  = m.id
    LEFT JOIN ratings r       ON r.movie_id  = m.id
    ${whereClause}
    GROUP BY m.id
    ORDER BY m.id
  `, params);

  return rows.map(row => ({
    id:          row.id,
    title:       row.title,
    year:        row.year,
    duration:    row.duration,
    rating:      parseFloat(row.rating) || 0,
    avgRating:   row.avg_user_rating ? parseFloat(row.avg_user_rating) : null,
    reviewCount: row.review_count || 0,
    price:       row.price,
    description: row.description,
    poster:      row.poster,
    backdrop:    row.backdrop,
    trailer:     row.trailer,
    director:    row.director,
    featured:    row.featured === 1,
    nowPlaying:  row.now_playing === 1,
    genre:       row.genre_names   ? row.genre_names.split('||')   : [],
    cast:        row.cast_names    ? row.cast_names.split('||')    : [],
    showtimes:   row.showtime_list ? row.showtime_list.split('||') : [],
    createdAt:   row.created_at
  }));
}

// ---- GET /api/movies ----
router.get('/', async (req, res) => {
  try {
    const movies = await fetchMovies();
    res.json({ success: true, data: movies });
  } catch (err) {
    console.error('[movies/get all]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---- GET /api/movies/:id ----
router.get('/:id', async (req, res) => {
  try {
    const movies = await fetchMovies('WHERE m.id = ?', [req.params.id]);
    if (!movies.length)
      return res.status(404).json({ success: false, error: 'Film tidak ditemukan.' });
    res.json({ success: true, data: movies[0] });
  } catch (err) {
    console.error('[movies/get one]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---- POST /api/movies (admin) ----
router.post('/', requireAdmin, async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { title, director, year, duration, rating, price, description,
            poster, backdrop, trailer, genre, cast, showtimes, nowPlaying, featured } = req.body;

    if (!title || !director || !year || !duration || !price)
      return res.status(400).json({ success: false, error: 'Field wajib: title, director, year, duration, price.' });

    await conn.beginTransaction();

    const [result] = await conn.query(
      `INSERT INTO movies (title, director, year, duration, rating, price, description,
                           poster, backdrop, trailer, now_playing, featured)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, director, year, duration, rating || 7.0, price, description || '',
       poster || '', backdrop || '', trailer || '',
       nowPlaying ? 1 : 0, featured ? 1 : 0]
    );
    const movieId = result.insertId;

    // Genres
    if (genre && genre.length) {
      for (const g of genre) {
        let [gRows] = await conn.query('SELECT id FROM genres WHERE name = ?', [g]);
        let genreId;
        if (gRows.length) {
          genreId = gRows[0].id;
        } else {
          const [gRes] = await conn.query('INSERT INTO genres (name) VALUES (?)', [g]);
          genreId = gRes.insertId;
        }
        await conn.query('INSERT INTO movie_genres (movie_id, genre_id) VALUES (?, ?)', [movieId, genreId]);
      }
    }

    // Cast
    if (cast && cast.length) {
      for (let i = 0; i < cast.length; i++) {
        await conn.query(
          'INSERT INTO movie_cast (movie_id, actor_name, cast_order) VALUES (?, ?, ?)',
          [movieId, cast[i], i + 1]
        );
      }
    }

    // Showtimes
    const times = (showtimes && showtimes.length) ? showtimes : ['10:00', '13:00', '16:00', '19:00'];
    for (const t of times) {
      await conn.query('INSERT INTO showtimes (movie_id, show_time) VALUES (?, ?)', [movieId, t]);
    }

    await conn.commit();

    const [newMovies] = await fetchMovies('WHERE m.id = ?', [movieId]);
    // refetch
    const added = (await fetchMovies('WHERE m.id = ?', [movieId]))[0];
    res.status(201).json({ success: true, data: added });
  } catch (err) {
    try { await conn.rollback(); } catch (e) { console.error('Rollback failed:', e.message); }
    console.error('[movies/add]', err);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    conn.release();
  }
});

// ---- PUT /api/movies/:id (admin) ----
router.put('/:id', requireAdmin, async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { id } = req.params;
    const { title, director, year, duration, rating, price, description,
            poster, backdrop, trailer, genre, cast, showtimes, nowPlaying, featured } = req.body;

    await conn.beginTransaction();

    await conn.query(
      `UPDATE movies SET title=?, director=?, year=?, duration=?, rating=?, price=?,
       description=?, poster=?, backdrop=?, trailer=?, now_playing=?, featured=?
       WHERE id=?`,
      [title, director, year, duration, rating || 7.0, price, description || '',
       poster || '', backdrop || '', trailer || '',
       nowPlaying ? 1 : 0, featured ? 1 : 0, id]
    );

    // Update genres (hapus lama, insert baru)
    if (genre) {
      await conn.query('DELETE FROM movie_genres WHERE movie_id = ?', [id]);
      for (const g of genre) {
        let [gRows] = await conn.query('SELECT id FROM genres WHERE name = ?', [g]);
        let genreId;
        if (gRows.length) {
          genreId = gRows[0].id;
        } else {
          const [gRes] = await conn.query('INSERT INTO genres (name) VALUES (?)', [g]);
          genreId = gRes.insertId;
        }
        await conn.query('INSERT IGNORE INTO movie_genres (movie_id, genre_id) VALUES (?, ?)', [id, genreId]);
      }
    }

    // Update cast
    if (cast) {
      await conn.query('DELETE FROM movie_cast WHERE movie_id = ?', [id]);
      for (let i = 0; i < cast.length; i++) {
        await conn.query(
          'INSERT INTO movie_cast (movie_id, actor_name, cast_order) VALUES (?, ?, ?)',
          [id, cast[i], i + 1]
        );
      }
    }

    // Update showtimes
    if (showtimes) {
      await conn.query('DELETE FROM showtimes WHERE movie_id = ?', [id]);
      for (const t of showtimes) {
        await conn.query('INSERT INTO showtimes (movie_id, show_time) VALUES (?, ?)', [id, t]);
      }
    }

    await conn.commit();
    const updated = (await fetchMovies('WHERE m.id = ?', [id]))[0];
    res.json({ success: true, data: updated });
  } catch (err) {
    try { await conn.rollback(); } catch (e) { console.error('Rollback failed:', e.message); }
    console.error('[movies/update]', err);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    conn.release();
  }
});

// ---- DELETE /api/movies/:id (admin) ----
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM movies WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0)
      return res.status(404).json({ success: false, error: 'Film tidak ditemukan.' });
    res.json({ success: true, message: 'Film berhasil dihapus.' });
  } catch (err) {
    console.error('[movies/delete]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
