// ============================================================
// routes/admin.js - Endpoint khusus Admin (Users & Stats)
// ============================================================
const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { requireAdmin } = require('../middleware/auth');

// ---- GET /api/admin/users ----
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const [users] = await db.query(
      `SELECT u.id, u.name, u.email, u.role, u.avatar, u.created_at,
              COUNT(DISTINCT t.id) AS ticket_count,
              COUNT(DISTINCT r.id) AS review_count
       FROM users u
       LEFT JOIN tickets t ON t.user_id = u.id
       LEFT JOIN ratings  r ON r.user_id = u.id
       GROUP BY u.id
       ORDER BY u.created_at DESC`
    );
    res.json({ success: true, data: users });
  } catch (err) {
    console.error('[admin/users]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---- GET /api/admin/stats ----
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const [[{ movieCount }]]  = await db.query('SELECT COUNT(*) AS movieCount FROM movies');
    const [[{ ticketCount }]] = await db.query("SELECT COUNT(*) AS ticketCount FROM tickets WHERE status='confirmed'");
    const [[{ userCount }]]   = await db.query("SELECT COUNT(*) AS userCount FROM users WHERE role='user'");
    const [[{ revenue }]]     = await db.query("SELECT COALESCE(SUM(total_amount),0) AS revenue FROM payments WHERE status='success'");
    const [[{ reviewCount }]] = await db.query('SELECT COUNT(*) AS reviewCount FROM ratings');

    res.json({
      success: true,
      data: { movieCount, ticketCount, userCount, revenue, reviewCount }
    });
  } catch (err) {
    console.error('[admin/stats]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
