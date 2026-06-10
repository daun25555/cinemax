// ============================================================
// routes/payments.js - Endpoint Pembayaran
// ============================================================
const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Kode promo yang tersedia
const PROMO_CODES = {
  'CINEMAX20': 0.20,
  'HEMAT10':   0.10,
  'FILM50':    0.50,
  'NONTON':    0.15,
};

// ---- POST /api/payments/process ----
router.post('/process', requireAuth, async (req, res) => {
  try {
    const { ticketId, paymentMethod, paymentProvider, promoCode,
            subtotal, serviceFee, discountAmount, totalAmount } = req.body;
    const userId = req.user.id;

    if (!ticketId || !paymentMethod)
      return res.status(400).json({ success: false, error: 'ticketId dan paymentMethod wajib.' });

    // Validasi kode promo jika ada
    let validatedDiscount = discountAmount || 0;
    if (promoCode && PROMO_CODES[promoCode.toUpperCase()]) {
      const pct = PROMO_CODES[promoCode.toUpperCase()];
      validatedDiscount = Math.floor((subtotal || 0) * pct);
    }

    const [result] = await db.query(
      `INSERT INTO payments
         (ticket_id, user_id, payment_method, payment_provider, subtotal,
          service_fee, discount_amount, total_amount, promo_code, status, paid_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'success', NOW())`,
      [ticketId, userId, paymentMethod, paymentProvider || null,
       subtotal || 0, serviceFee || 3000, validatedDiscount,
       totalAmount || 0, promoCode || null]
    );

    // Update status tiket menjadi confirmed
    await db.query(
      "UPDATE tickets SET status = 'confirmed' WHERE id = ?",
      [ticketId]
    );

    res.status(201).json({
      success: true,
      data: {
        id:             result.insertId,
        ticketId,
        paymentMethod,
        totalAmount:    totalAmount || 0,
        status:         'success',
        paidAt:         new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('[payments/process]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---- GET /api/payments/all (admin) ----
router.get('/all', requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.*, u.name AS user_name, t.movie_title
       FROM payments p
       LEFT JOIN users u   ON u.id  = p.user_id
       LEFT JOIN tickets t ON t.id  = p.ticket_id
       ORDER BY p.created_at DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[payments/all]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
