// ============================================================
// middleware/auth.js - JWT Authentication Middleware
// ============================================================
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'cinemax_super_secret_jwt_2024_xK9mPq';

/**
 * Middleware: Wajib login (token valid)
 */
function requireAuth(req, res, next) {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Akses ditolak. Silakan login terlebih dahulu.' });
  }
  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Token tidak valid atau sudah kadaluarsa.' });
  }
}

/**
 * Middleware: Wajib role admin
 */
function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Akses ditolak. Hanya admin yang diizinkan.' });
    }
    next();
  });
}

/**
 * Helper: Generate JWT token
 */
function generateToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

module.exports = { requireAuth, requireAdmin, generateToken };
