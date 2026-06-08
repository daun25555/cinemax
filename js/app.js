// ==================== CINEMAX APP ====================
const ADMIN = { email: 'admin@cinemax.com', password: 'Admin@123', name: 'Admin', role: 'admin' };

// ---- Storage Helpers ----
const Storage = {
  get: (key) => JSON.parse(localStorage.getItem(key) || 'null'),
  set: (key, val) => localStorage.setItem(key, JSON.stringify(val)),
  remove: (key) => localStorage.removeItem(key),
};

// ---- Auth ----
const Auth = {
  getUsers: () => Storage.get('cinemax_users') || [],
  saveUsers: (users) => Storage.set('cinemax_users', users),
  getCurrentUser: () => Storage.get('cinemax_current_user'),
  setCurrentUser: (user) => Storage.set('cinemax_current_user', user),
  logout: () => { Storage.remove('cinemax_current_user'); window.location.href = 'index.html'; },

  register: (name, email, password) => {
    const users = Auth.getUsers();
    if (email === ADMIN.email) return { success: false, error: 'Email sudah terdaftar.' };
    if (users.find(u => u.email === email)) return { success: false, error: 'Email sudah terdaftar.' };
    const user = { id: Date.now(), name, email, password, role: 'user', createdAt: new Date().toISOString(), avatar: name.charAt(0).toUpperCase() };
    users.push(user);
    Auth.saveUsers(users);
    return { success: true, user };
  },

  login: (email, password) => {
    if (email === ADMIN.email && password === ADMIN.password) {
      const adminUser = { id: 'admin', name: 'Admin', email: ADMIN.email, role: 'admin', avatar: 'A' };
      Auth.setCurrentUser(adminUser);
      return { success: true, user: adminUser };
    }
    const users = Auth.getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) return { success: false, error: 'Email atau password salah.' };
    Auth.setCurrentUser(user);
    return { success: true, user };
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

// ---- Movies ----
const Movies = {
  getAll: () => Storage.get('cinemax_movies') || Movies.getSeedData(),
  save: (movies) => Storage.set('cinemax_movies', movies),

  getById: (id) => {
    const movies = Movies.getAll();
    return movies.find(m => m.id == id) || null;
  },

  add: (movie) => {
    const movies = Movies.getAll();
    movie.id = Date.now();
    movie.createdAt = new Date().toISOString();
    movies.unshift(movie);
    Movies.save(movies);
    return movie;
  },

  update: (id, data) => {
    const movies = Movies.getAll();
    const idx = movies.findIndex(m => m.id == id);
    if (idx === -1) return false;
    movies[idx] = { ...movies[idx], ...data };
    Movies.save(movies);
    return movies[idx];
  },

  delete: (id) => {
    const movies = Movies.getAll();
    const filtered = movies.filter(m => m.id != id);
    Movies.save(filtered);
  },

  getSeedData: () => {
    const seed = [
      {
        id: 1, title: 'Interstellar', year: 2014, genre: ['Sci-Fi', 'Drama'],
        duration: 169, rating: 8.6, price: 55000,
        description: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.',
        poster: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIe.jpg',
        backdrop: 'https://image.tmdb.org/t/p/original/xJHokMbljvjADYdit5fK5VQsXEG.jpg',
        trailer: 'https://www.youtube.com/embed/zSWdZVtXT7E',
        director: 'Christopher Nolan', cast: ['Matthew McConaughey', 'Anne Hathaway', 'Jessica Chastain'],
        showtimes: ['10:00', '13:30', '17:00', '20:30'], featured: true, nowPlaying: true
      },
      {
        id: 2, title: 'Dune: Part Two', year: 2024, genre: ['Sci-Fi', 'Adventure'],
        duration: 166, rating: 8.5, price: 65000,
        description: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.',
        poster: 'https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg',
        backdrop: 'https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg',
        trailer: 'https://www.youtube.com/embed/Way9Dexny3w',
        director: 'Denis Villeneuve', cast: ['Timothée Chalamet', 'Zendaya', 'Rebecca Ferguson'],
        showtimes: ['11:00', '14:30', '18:00', '21:30'], featured: true, nowPlaying: true
      },
      {
        id: 3, title: 'Oppenheimer', year: 2023, genre: ['Drama', 'History'],
        duration: 180, rating: 8.4, price: 60000,
        description: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.',
        poster: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
        backdrop: 'https://image.tmdb.org/t/p/original/rLb2cwF3Pazuxaj0sRXQ037tGI1.jpg',
        trailer: 'https://www.youtube.com/embed/uYPbbksJxIg',
        director: 'Christopher Nolan', cast: ['Cillian Murphy', 'Emily Blunt', 'Matt Damon'],
        showtimes: ['10:30', '14:00', '17:30', '21:00'], featured: true, nowPlaying: true
      },
      {
        id: 4, title: 'The Batman', year: 2022, genre: ['Action', 'Crime'],
        duration: 176, rating: 7.8, price: 55000,
        description: 'When a serial killer targets Gotham\'s elite with a series of sadistic machinations, Batman is forced to investigate the city\'s hidden corruption.',
        poster: 'https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg',
        backdrop: 'https://image.tmdb.org/t/p/original/b0PlSFdDwbyK0cf5RxwDpaOJQvQ.jpg',
        trailer: 'https://www.youtube.com/embed/mqqft2x_Aa4',
        director: 'Matt Reeves', cast: ['Robert Pattinson', 'Zoë Kravitz', 'Paul Dano'],
        showtimes: ['12:00', '15:30', '19:00', '22:30'], featured: false, nowPlaying: true
      },
      {
        id: 5, title: 'Avengers: Endgame', year: 2019, genre: ['Action', 'Sci-Fi'],
        duration: 181, rating: 8.4, price: 50000,
        description: 'After the devastating events of Infinity War, the Avengers assemble once more to undo Thanos\' actions and restore order to the universe.',
        poster: 'https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg',
        backdrop: 'https://image.tmdb.org/t/p/original/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg',
        trailer: 'https://www.youtube.com/embed/TcMBFSGVi1c',
        director: 'Anthony & Joe Russo', cast: ['Robert Downey Jr.', 'Chris Evans', 'Scarlett Johansson'],
        showtimes: ['11:30', '15:00', '18:30', '22:00'], featured: false, nowPlaying: false
      },
      {
        id: 6, title: 'Inception', year: 2010, genre: ['Sci-Fi', 'Thriller'],
        duration: 148, rating: 8.8, price: 45000,
        description: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
        poster: 'https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg',
        backdrop: 'https://image.tmdb.org/t/p/original/s2bT29y0ngXxxu2IA8AOzzXTRhd.jpg',
        trailer: 'https://www.youtube.com/embed/YoHD9XEInc0',
        director: 'Christopher Nolan', cast: ['Leonardo DiCaprio', 'Joseph Gordon-Levitt', 'Elliot Page'],
        showtimes: ['10:00', '13:00', '16:00', '19:00'], featured: false, nowPlaying: false
      },
      {
        id: 7, title: 'Spider-Man: No Way Home', year: 2021, genre: ['Action', 'Sci-Fi'],
        duration: 148, rating: 8.3, price: 60000,
        description: 'With Spider-Man\'s identity revealed, Peter asks Doctor Strange for help. When a spell goes wrong, dangerous foes from other worlds start to appear.',
        poster: 'https://image.tmdb.org/t/p/w500/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg',
        backdrop: 'https://image.tmdb.org/t/p/original/iQFcwSGbZXMkeyKrxbPnwnRo5fl.jpg',
        trailer: 'https://www.youtube.com/embed/JfVOs4VSpmA',
        director: 'Jon Watts', cast: ['Tom Holland', 'Zendaya', 'Benedict Cumberbatch'],
        showtimes: ['10:30', '13:30', '17:00', '20:00'], featured: true, nowPlaying: true
      },
      {
        id: 8, title: 'The Dark Knight', year: 2008, genre: ['Action', 'Crime', 'Thriller'],
        duration: 152, rating: 9.0, price: 45000,
        description: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
        poster: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
        backdrop: 'https://image.tmdb.org/t/p/original/hkBaDkMWbLaf8B1lsWsKX7Ew3Xq.jpg',
        trailer: 'https://www.youtube.com/embed/EXeTwQWrcwY',
        director: 'Christopher Nolan', cast: ['Christian Bale', 'Heath Ledger', 'Aaron Eckhart'],
        showtimes: ['11:00', '14:00', '18:00', '21:00'], featured: true, nowPlaying: false
      },
      {
        id: 9, title: 'Parasite', year: 2019, genre: ['Thriller', 'Drama'],
        duration: 132, rating: 8.5, price: 50000,
        description: 'Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.',
        poster: 'https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg',
        backdrop: 'https://image.tmdb.org/t/p/original/TU9NIjwzjoKPwQHoHshkFcQUCG.jpg',
        trailer: 'https://www.youtube.com/embed/5xH0HfJHsaY',
        director: 'Bong Joon-ho', cast: ['Song Kang-ho', 'Lee Sun-kyun', 'Cho Yeo-jeong'],
        showtimes: ['12:00', '15:00', '19:00', '21:30'], featured: false, nowPlaying: false
      },
      {
        id: 10, title: 'Everything Everywhere All at Once', year: 2022, genre: ['Sci-Fi', 'Comedy', 'Action'],
        duration: 139, rating: 7.8, price: 55000,
        description: 'A middle-aged Chinese immigrant is swept up in an insane adventure where she alone can save the world by exploring other universes connecting with the lives she could have led.',
        poster: 'https://image.tmdb.org/t/p/w500/w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg',
        backdrop: 'https://image.tmdb.org/t/p/original/feSiISwgEpVzR1v3zv2n2AU4ANJ.jpg',
        trailer: 'https://www.youtube.com/embed/wxN1T1uxQ2g',
        director: 'Daniel Kwan & Daniel Scheinert', cast: ['Michelle Yeoh', 'Stephanie Hsu', 'Ke Huy Quan'],
        showtimes: ['10:00', '13:00', '16:30', '20:00'], featured: false, nowPlaying: true
      },
      {
        id: 11, title: 'Top Gun: Maverick', year: 2022, genre: ['Action', 'Drama'],
        duration: 130, rating: 8.3, price: 60000,
        description: 'After more than thirty years of service as one of the Navy\'s top aviators, Pete "Maverick" Mitchell is where he belongs, pushing the envelope as a courageous test pilot.',
        poster: 'https://image.tmdb.org/t/p/w500/62HCnUTziyWcpDaBO2i1DX17ljH.jpg',
        backdrop: 'https://image.tmdb.org/t/p/original/AkozGCHiJpITCIGBhGEBFMaZXfL.jpg',
        trailer: 'https://www.youtube.com/embed/giXco2jaZ_4',
        director: 'Joseph Kosinski', cast: ['Tom Cruise', 'Miles Teller', 'Jennifer Connelly'],
        showtimes: ['11:30', '14:30', '18:00', '21:00'], featured: true, nowPlaying: true
      },
      {
        id: 12, title: 'Black Panther: Wakanda Forever', year: 2022, genre: ['Action', 'Sci-Fi'],
        duration: 161, rating: 6.9, price: 55000,
        description: 'The people of Wakanda fight to protect their home from intervening world powers as they mourn the death of King T\'Challa.',
        poster: 'https://image.tmdb.org/t/p/w500/sv1xJUazXoQuIDTqnVWt5CHmLCa.jpg',
        backdrop: 'https://image.tmdb.org/t/p/original/xDMIl84Qo5Tsu62c9DGWhmPI67A.jpg',
        trailer: 'https://www.youtube.com/embed/_Z3QKkl1WyM',
        director: 'Ryan Coogler', cast: ['Letitia Wright', 'Angela Bassett', 'Lupita Nyong\'o'],
        showtimes: ['10:00', '13:00', '17:00', '20:30'], featured: false, nowPlaying: true
      },
      {
        id: 13, title: 'Avatar: The Way of Water', year: 2022, genre: ['Sci-Fi', 'Adventure'],
        duration: 192, rating: 7.6, price: 75000,
        description: 'Jake Sully lives with his newfound family formed on the planet of Pandora. Once a familiar threat returns to finish what was previously started, Jake must work with Neytiri.',
        poster: 'https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg',
        backdrop: 'https://image.tmdb.org/t/p/original/198vrF8k5UvCraM1njDRgCHNgxI.jpg',
        trailer: 'https://www.youtube.com/embed/a8Gx8wiNbs8',
        director: 'James Cameron', cast: ['Sam Worthington', 'Zoe Saldana', 'Sigourney Weaver'],
        showtimes: ['10:00', '14:00', '18:00', '22:00'], featured: true, nowPlaying: true
      },
      {
        id: 14, title: 'Doctor Strange in the Multiverse of Madness', year: 2022, genre: ['Action', 'Horror', 'Sci-Fi'],
        duration: 126, rating: 6.9, price: 60000,
        description: 'Doctor Strange teams with a mysterious teenager who can travel between multiverses to face a powerful enemy determined to harness their power.',
        poster: 'https://image.tmdb.org/t/p/w500/9Gtg2DzbZuKhp8E9qHMzGXv2tMO.jpg',
        backdrop: 'https://image.tmdb.org/t/p/original/H5HjE7Xb9N09rbWn1zBfxgI8uz.jpg',
        trailer: 'https://www.youtube.com/embed/aWzlQ2N6qqg',
        director: 'Sam Raimi', cast: ['Benedict Cumberbatch', 'Elizabeth Olsen', 'Chiwetel Ejiofor'],
        showtimes: ['11:00', '14:00', '17:30', '21:00'], featured: false, nowPlaying: false
      },
      {
        id: 15, title: 'Guardians of the Galaxy Vol. 3', year: 2023, genre: ['Action', 'Comedy', 'Sci-Fi'],
        duration: 150, rating: 7.9, price: 60000,
        description: 'Still reeling from the loss of Gamora, Peter Quill rallies his team to defend the universe and protect one of their own on a mission that could mean the end of the Guardians.',
        poster: 'https://image.tmdb.org/t/p/w500/r2J02Z2OpNTctfOSN1Ydgii51I3.jpg',
        backdrop: 'https://image.tmdb.org/t/p/original/nHf61UzkfFno5X1ofIjWpbVoQom.jpg',
        trailer: 'https://www.youtube.com/embed/u3V5KDHRQvk',
        director: 'James Gunn', cast: ['Chris Pratt', 'Zoe Saldana', 'Bradley Cooper'],
        showtimes: ['10:30', '13:30', '17:00', '20:30'], featured: false, nowPlaying: true
      },
      {
        id: 16, title: 'Joker', year: 2019, genre: ['Crime', 'Drama', 'Thriller'],
        duration: 122, rating: 8.4, price: 50000,
        description: 'A mentally troubled stand-up comedian embarks on a downward spiral of revolution and bloody crime. This path brings him face-to-face with his alter-ego: "The Joker".',
        poster: 'https://image.tmdb.org/t/p/w500/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg',
        backdrop: 'https://image.tmdb.org/t/p/original/f5F4cRhQdUbyVbB5lTNCwURLTTa.jpg',
        trailer: 'https://www.youtube.com/embed/zAGVQLHvwOY',
        director: 'Todd Phillips', cast: ['Joaquin Phoenix', 'Robert De Niro', 'Zazie Beetz'],
        showtimes: ['11:30', '15:00', '18:30', '21:30'], featured: true, nowPlaying: false
      },
      {
        id: 17, title: 'The Shawshank Redemption', year: 1994, genre: ['Drama', 'Crime'],
        duration: 142, rating: 9.3, price: 35000,
        description: 'Over the course of several years, two convicts form a friendship, seeking consolation and, eventually, redemption through basic compassion.',
        poster: 'https://image.tmdb.org/t/p/w500/lyQBXzOQSuE59IsHyhrp0qIiPAz.jpg',
        backdrop: 'https://image.tmdb.org/t/p/original/kXfqcdQKsToO0OUXHcrrNCHDBzO.jpg',
        trailer: 'https://www.youtube.com/embed/6hB3S9bIaco',
        director: 'Frank Darabont', cast: ['Tim Robbins', 'Morgan Freeman', 'Bob Gunton'],
        showtimes: ['12:00', '15:30', '19:00'], featured: false, nowPlaying: false
      },
      {
        id: 18, title: 'Spirited Away', year: 2001, genre: ['Animation', 'Fantasy', 'Adventure'],
        duration: 125, rating: 8.6, price: 40000,
        description: 'During her family\'s move to the suburbs, a sullen 10-year-old girl wanders into a world ruled by gods, witches, and spirits, and where humans are changed into beasts.',
        poster: 'https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg',
        backdrop: 'https://image.tmdb.org/t/p/original/bSXfU4dwZyBA1vMmXvejdRXBvuF.jpg',
        trailer: 'https://www.youtube.com/embed/ByXuk9QqQkk',
        director: 'Hayao Miyazaki', cast: ['Daveigh Chase', 'Suzanne Pleshette', 'Miyu Irino'],
        showtimes: ['10:00', '13:00', '16:00'], featured: false, nowPlaying: false
      },
      {
        id: 19, title: 'La La Land', year: 2016, genre: ['Romance', 'Drama', 'Musical'],
        duration: 128, rating: 8.0, price: 45000,
        description: 'While navigating their careers in Los Angeles, a pianist and an actress fall in love while attempting to reconcile their aspirations for the future.',
        poster: 'https://image.tmdb.org/t/p/w500/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg',
        backdrop: 'https://image.tmdb.org/t/p/original/nadTlnTE6DdgmYsN4iWd2SO1NDF.jpg',
        trailer: 'https://www.youtube.com/embed/0pdqf4P9MB8',
        director: 'Damien Chazelle', cast: ['Ryan Gosling', 'Emma Stone', 'John Legend'],
        showtimes: ['11:00', '14:30', '18:00', '21:00'], featured: false, nowPlaying: false
      },
      {
        id: 20, title: 'Mission: Impossible – Dead Reckoning', year: 2023, genre: ['Action', 'Thriller'],
        duration: 163, rating: 7.7, price: 65000,
        description: 'Ethan Hunt and his IMF team must track down a terrifying new weapon that threatens all of humanity before it falls into the wrong hands.',
        poster: 'https://image.tmdb.org/t/p/w500/NNxYkU70HPurnNCSiCjYAmacwm.jpg',
        backdrop: 'https://image.tmdb.org/t/p/original/4GbFHsZVTw5sTaH2nMPFABuqFkX.jpg',
        trailer: 'https://www.youtube.com/embed/avz06PDqgaM',
        director: 'Christopher McQuarrie', cast: ['Tom Cruise', 'Hayley Atwell', 'Ving Rhames'],
        showtimes: ['10:30', '13:30', '17:00', '21:00'], featured: true, nowPlaying: true
      },
    ];
    Storage.set('cinemax_movies', seed);
    return seed;
  }
};

// ---- Tickets ----
const Tickets = {
  getAll: () => Storage.get('cinemax_tickets') || [],
  save: (tickets) => Storage.set('cinemax_tickets', tickets),

  getByUser: (userId) => Tickets.getAll().filter(t => t.userId == userId),

  buy: (userId, movieId, showtime, date, seats, seatNumbers) => {
    const tickets = Tickets.getAll();
    const movie = Movies.getById(movieId);
    if (!movie) return null;
    const ticket = {
      id: 'TIX' + Date.now(),
      userId, movieId,
      movieTitle: movie.title,
      moviePoster: movie.poster,
      showtime, date,
      seats, seatNumbers,
      totalPrice: movie.price * seats,
      purchaseDate: new Date().toISOString(),
      status: 'confirmed'
    };
    tickets.push(ticket);
    Tickets.save(tickets);
    return ticket;
  }
};

// ---- Ratings ----
const Ratings = {
  getAll: () => Storage.get('cinemax_ratings') || [],
  save: (ratings) => Storage.set('cinemax_ratings', ratings),

  getByMovie: (movieId) => Ratings.getAll().filter(r => r.movieId == movieId),
  getByUser: (userId) => Ratings.getAll().filter(r => r.userId == userId),

  getUserRating: (userId, movieId) => {
    return Ratings.getAll().find(r => r.userId == userId && r.movieId == movieId) || null;
  },

  add: (userId, movieId, rating, review) => {
    const ratings = Ratings.getAll();
    const existing = ratings.findIndex(r => r.userId == userId && r.movieId == movieId);
    const ratingObj = {
      id: Date.now(), userId, movieId, rating, review,
      date: new Date().toISOString(),
      userName: Auth.getCurrentUser()?.name || 'Anonymous'
    };
    if (existing > -1) ratings[existing] = ratingObj;
    else ratings.push(ratingObj);
    Ratings.save(ratings);
    return ratingObj;
  },

  getAverage: (movieId) => {
    const movieRatings = Ratings.getByMovie(movieId);
    if (!movieRatings.length) return null;
    return (movieRatings.reduce((s, r) => s + r.rating, 0) / movieRatings.length).toFixed(1);
  }
};

// ---- UI Helpers ----
const UI = {
  updateNav: () => {
    const user = Auth.getCurrentUser();
    const navUser = document.getElementById('nav-user');
    const navAuth = document.getElementById('nav-auth');
    const navAdmin = document.getElementById('nav-admin');

    if (navUser && navAuth) {
      if (user) {
        navUser.innerHTML = `
          <a href="profile.html" style="display:flex;align-items:center;gap:8px;text-decoration:none;color:inherit">
            <span class="nav-avatar">${user.avatar || user.name.charAt(0)}</span>
            <span class="nav-name">${user.name}</span>
          </a>
          <button class="btn-logout" onclick="Auth.logout()">Keluar</button>
        `;
        navUser.style.display = 'flex';
        navAuth.style.display = 'none';
        if (navAdmin) navAdmin.style.display = user.role === 'admin' ? 'flex' : 'none';
      } else {
        navUser.style.display = 'none';
        navAuth.style.display = 'flex';
        if (navAdmin) navAdmin.style.display = 'none';
      }
    }
  },

  formatPrice: (price) => 'Rp ' + price.toLocaleString('id-ID'),
  formatDuration: (min) => `${Math.floor(min / 60)}j ${min % 60}m`,

  showToast: (msg, type = 'success') => {
    let toast = document.getElementById('toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.className = `toast toast-${type} show`;
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
