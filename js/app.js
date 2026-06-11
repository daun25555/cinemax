// ==================== CINEMAX APP (Database Version) ====================
// app.js menggunakan fetch() ke backend API, bukan localStorage lagi

const API_BASE = 'http://localhost:3000/api';

// ---- API Helper ----
const _api = {
  token: () => localStorage.getItem('cinemax_token'),

  headers() {
    const h = { 'Content-Type': 'application/json' };
    const t = this.token();
    if (t) h['Authorization'] = 'Bearer ' + t;
    return h;
  },

  async get(path) {
    const r = await fetch(API_BASE + path, { headers: this.headers() });
    return r.json();
  },

  async post(path, data) {
    const r = await fetch(API_BASE + path, {
      method: 'POST', headers: this.headers(), body: JSON.stringify(data)
    });
    return r.json();
  },

  async put(path, data) {
    const r = await fetch(API_BASE + path, {
      method: 'PUT', headers: this.headers(), body: JSON.stringify(data)
    });
    return r.json();
  },

  async delete(path) {
    const r = await fetch(API_BASE + path, {
      method: 'DELETE', headers: this.headers()
    });
    return r.json();
  }
};

// ============================================================
// Auth
// ============================================================
const Auth = {
  getCurrentUser: () => {
    const s = localStorage.getItem('cinemax_current_user');
    return s ? JSON.parse(s) : null;
  },

  setCurrentUser: (u) => localStorage.setItem('cinemax_current_user', JSON.stringify(u)),

  logout: () => {
    localStorage.removeItem('cinemax_token');
    localStorage.removeItem('cinemax_current_user');
    window.location.href = 'index.html';
  },

  register: async (name, email, password) => {
    try {
      const res = await _api.post('/auth/register', { name, email, password });
      if (res.success) {
        localStorage.setItem('cinemax_token', res.token);
        Auth.setCurrentUser(res.user);
      }
      return res;
    } catch (e) {
      return { success: false, error: 'Tidak dapat terhubung ke server.' };
    }
  },

  login: async (email, password) => {
    try {
      const res = await _api.post('/auth/login', { email, password });
      if (res.success) {
        localStorage.setItem('cinemax_token', res.token);
        Auth.setCurrentUser(res.user);
      }
      return res;
    } catch (e) {
      return { success: false, error: 'Tidak dapat terhubung ke server.' };
    }
  },

  requireAuth: () => {
    const user = Auth.getCurrentUser();
    if (!user) { window.location.href = 'login.html'; return null; }
    return user;
  },

  requireAdmin: () => {
    const user = Auth.getCurrentUser();
    if (!user || user.role !== 'admin') { window.location.href = 'index.html'; return null; }
    return user;
  }
};

// ============================================================
// Movies
// ============================================================
let _moviesCache = null;

const Movies = {
  // Fetch dari API dan cache di memori
  init: async () => {
    if (_moviesCache) return _moviesCache;
    try {
      const res = await _api.get('/movies');
      _moviesCache = res.success ? res.data : [];
    } catch (e) {
      console.error('Gagal memuat data film:', e);
      _moviesCache = [];
    }
    return _moviesCache;
  },

  getAll:   () => _moviesCache || [],
  getById:  (id) => (_moviesCache || []).find(m => m.id == id) || null,

  add: async (movieData) => {
    try {
      const res = await _api.post('/movies', movieData);
      if (res.success) _moviesCache = null; // invalidate cache
      return res;
    } catch (e) { return { success: false, error: 'Gagal menambah film.' }; }
  },

  update: async (id, movieData) => {
    try {
      const res = await _api.put('/movies/' + id, movieData);
      if (res.success) _moviesCache = null;
      return res;
    } catch (e) { return { success: false, error: 'Gagal mengupdate film.' }; }
  },

  delete: async (id) => {
    try {
      const res = await _api.delete('/movies/' + id);
      if (res.success) _moviesCache = null;
      return res;
    } catch (e) { return { success: false, error: 'Gagal menghapus film.' }; }
  },

  // Kompatibilitas (tidak diperlukan lagi, data dari DB)
  save: () => {},
  getSeedData: () => []
};

// ============================================================
// Cinemas
// ============================================================
const Cinemas = {
  getAll: async () => {
    try {
      const res = await _api.get('/cinemas');
      return res.success ? res.data : [];
    } catch (e) { return []; }
  },

  getShowtimes: async (cinemaId, movieId) => {
    try {
      const res = await _api.get(`/cinemas/${cinemaId}/showtimes/${movieId}`);
      return res.success ? res.data : [];
    } catch (e) { return []; }
  }
};

// ============================================================
// Tickets
// ============================================================
const Tickets = {
  getByUser: async (userId) => {
    try {
      const res = await _api.get('/tickets/my');
      return res.success ? res.data : [];
    } catch (e) { return []; }
  },

  getAll: async () => {
    try {
      const res = await _api.get('/tickets/all');
      return res.success ? res.data : [];
    } catch (e) { return []; }
  },

  getOccupiedSeats: async (movieId, date, showtime, studioId, cinemaId) => {
    try {
      const res = await _api.get(`/tickets/occupied-seats?movieId=${movieId}&date=${date}&showtime=${showtime}&studioId=${studioId}&cinemaId=${cinemaId}`);
      return res.success ? res.data : [];
    } catch (e) { return []; }
  },

  buy: async (userId, movieId, showtime, date, seats, seatNumbers, cinemaId, studioId) => {
    try {
      const res = await _api.post('/tickets/buy', { movieId, showtime, date, seats, seatNumbers, cinemaId, studioId });
      return res.success ? res.data : null;
    } catch (e) { return null; }
  }
};

// ============================================================
// Ratings
// ============================================================
let _ratingsCache = {};

const Ratings = {
  getByMovie: async (movieId) => {
    try {
      const res = await _api.get('/ratings/movie/' + movieId);
      const data = res.success ? res.data : [];
      _ratingsCache[movieId] = data;
      return data;
    } catch (e) { return []; }
  },

  getByUser: async (userId) => {
    try {
      const res = await _api.get('/ratings/my');
      return res.success ? res.data : [];
    } catch (e) { return []; }
  },

  getUserRating: async (userId, movieId) => {
    try {
      const res = await _api.get('/ratings/user/' + movieId);
      return res.success ? res.data : null;
    } catch (e) { return null; }
  },

  add: async (userId, movieId, rating, review) => {
    try {
      const res = await _api.post('/ratings', { movieId, rating, review });
      if (res.success) delete _ratingsCache[movieId]; // invalidate
      return res.success ? res.data : null;
    } catch (e) { return null; }
  },

  // Ambil rata-rata dari cache movies (sudah di-include saat Movies.init())
  getAverage: (movieId) => {
    const movie = (_moviesCache || []).find(m => m.id == movieId);
    if (!movie) return null;
    return movie.avgRating ? parseFloat(movie.avgRating).toFixed(1) : null;
  },

  // Admin: ambil semua rating
  getAll: async () => {
    try {
      const res = await _api.get('/ratings/all');
      return res.success ? res.data : [];
    } catch (e) { return []; }
  }
};

// ============================================================
// Admin
// ============================================================
const Admin = {
  getUsers: async () => {
    try {
      const res = await _api.get('/admin/users');
      return res.success ? res.data : [];
    } catch (e) { return []; }
  },
  getStats: async () => {
    try {
      const res = await _api.get('/admin/stats');
      return res.success ? res.data : null;
    } catch (e) { return null; }
  }
};

// ============================================================
// Watchlist
// ============================================================
const Watchlist = {
  getMyWatchlist: async () => {
    try {
      const res = await _api.get('/watchlist/my');
      return res.success ? res.data : [];
    } catch (e) { return []; }
  },
  toggleWatchlist: async (movieId) => {
    try {
      const res = await _api.post('/watchlist/toggle', { movieId });
      return res;
    } catch (e) { return { success: false, error: 'Network error' }; }
  },
  checkWatchlist: async (movieId) => {
    try {
      const res = await _api.get('/watchlist/check/' + movieId);
      return res.success ? res.inWatchlist : false;
    } catch (e) { return false; }
  }
};

// ============================================================
// Storage (kompatibilitas untuk session)
// ============================================================
const Storage = {
  get:    (key) => JSON.parse(localStorage.getItem(key) || 'null'),
  set:    (key, val) => localStorage.setItem(key, JSON.stringify(val)),
  remove: (key) => localStorage.removeItem(key),
};

// ============================================================
// UI Helpers
// ============================================================
const UI = {
  updateNav: () => {
    const user    = Auth.getCurrentUser();
    const navUser = document.getElementById('nav-user');
    const navAuth = document.getElementById('nav-auth');
    const navAdmin = document.getElementById('nav-admin');
    const navMyTickets = document.getElementById('nav-my-tickets');
    
    // Auto-inject wishlist nav item if not exists
    const navLinks = document.querySelector('.nav-links');
    if (navLinks && !document.getElementById('nav-wishlist')) {
      const li = document.createElement('li');
      li.id = 'nav-wishlist';
      li.style.display = 'none';
      li.innerHTML = '<a href="wishlist.html">♡ Wishlist</a>';
      navLinks.appendChild(li);
    }
    const navWishlist = document.getElementById('nav-wishlist');

    if (navUser && navAuth) {
      if (user) {
        navUser.innerHTML = `
          <a href="profile.html" style="display:flex;align-items:center;gap:8px;text-decoration:none;color:inherit">
            <span class="nav-avatar">${user.avatar || user.name.charAt(0)}</span>
            <span class="nav-name">${user.name}</span>
          </a>
          <button class="btn-logout" onclick="Auth.logout()">Keluar</button>
        `;
        navUser.style.display  = 'flex';
        navAuth.style.display  = 'none';
        if (navAdmin) navAdmin.style.display = user.role === 'admin' ? 'flex' : 'none';
        if (navMyTickets) navMyTickets.style.display = 'block';
        if (navWishlist) navWishlist.style.display = 'block';
      } else {
        navUser.style.display  = 'none';
        navAuth.style.display  = 'flex';
        if (navAdmin) navAdmin.style.display = 'none';
        if (navMyTickets) navMyTickets.style.display = 'none';
        if (navWishlist) navWishlist.style.display = 'none';
      }
    }
  },

  formatPrice:    (price)  => 'Rp ' + price.toLocaleString('id-ID'),
  formatDuration: (min)    => `${Math.floor(min / 60)}j ${min % 60}m`,

  showToast: (msg, type = 'success') => {
    let toast = document.getElementById('toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.className   = `toast toast-${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3000);
  },

  starRating: (rating) => {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    let stars = '';
    for (let i = 0; i < full; i++) stars += '★';
    if (half) stars += '½';
    for (let i = full + (half ? 1 : 0); i < 5; i++) stars += '☆';
    return `<span class="stars">${stars}</span>`;
  }
};

// Init nav on load
document.addEventListener('DOMContentLoaded', () => UI.updateNav());
