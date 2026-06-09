-- ============================================================
-- CINEMAX DATABASE - MySQL Schema
-- Sistem Database untuk Aplikasi Bioskop CineMax
-- Mencakup: Akun, Film, Pembelian Tiket, Penilaian, Pembayaran
-- ============================================================

-- Buat Database
CREATE DATABASE IF NOT EXISTS cinemax_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE cinemax_db;

-- ============================================================
-- 1. TABEL USERS (Data Akun Pengguna)
-- ============================================================
-- Menyimpan informasi akun pengguna yang mendaftar
-- Termasuk admin dan user biasa

CREATE TABLE users (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100)    NOT NULL COMMENT 'Nama lengkap pengguna',
  email       VARCHAR(150)    NOT NULL UNIQUE COMMENT 'Email untuk login (unik)',
  password    VARCHAR(255)    NOT NULL COMMENT 'Password (harus di-hash dengan bcrypt)',
  role        ENUM('user', 'admin') NOT NULL DEFAULT 'user' COMMENT 'Peran: user atau admin',
  avatar      VARCHAR(10)     DEFAULT NULL COMMENT 'Huruf inisial untuk avatar',
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Tanggal pendaftaran',
  updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_users_email (email),
  INDEX idx_users_role (role)
) ENGINE=InnoDB COMMENT='Tabel akun pengguna CineMax';


-- ============================================================
-- 2. TABEL GENRES (Master Data Genre Film)
-- ============================================================

CREATE TABLE genres (
  id    INT AUTO_INCREMENT PRIMARY KEY,
  name  VARCHAR(50) NOT NULL UNIQUE COMMENT 'Nama genre: Action, Sci-Fi, Drama, dll'
) ENGINE=InnoDB COMMENT='Master data genre film';


-- ============================================================
-- 3. TABEL MOVIES (Data Film)
-- ============================================================
-- Menyimpan seluruh informasi detail film

CREATE TABLE movies (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  title         VARCHAR(255)    NOT NULL COMMENT 'Judul film',
  year          YEAR            NOT NULL COMMENT 'Tahun rilis',
  duration      INT             NOT NULL COMMENT 'Durasi dalam menit',
  rating        DECIMAL(3,1)    NOT NULL DEFAULT 0.0 COMMENT 'Rating default/IMDB (1.0 - 10.0)',
  price         INT             NOT NULL DEFAULT 0 COMMENT 'Harga per tiket dalam Rupiah',
  description   TEXT            NULL COMMENT 'Sinopsis / deskripsi film',
  poster        VARCHAR(500)    NULL COMMENT 'URL gambar poster',
  backdrop      VARCHAR(500)    NULL COMMENT 'URL gambar backdrop/banner',
  trailer       VARCHAR(500)    NULL COMMENT 'URL embed trailer YouTube',
  director      VARCHAR(150)    NULL COMMENT 'Nama sutradara',
  featured      TINYINT(1)      NOT NULL DEFAULT 0 COMMENT 'Apakah film ditampilkan di featured/unggulan',
  now_playing   TINYINT(1)      NOT NULL DEFAULT 0 COMMENT 'Apakah film sedang tayang',
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_movies_title (title),
  INDEX idx_movies_year (year),
  INDEX idx_movies_now_playing (now_playing),
  INDEX idx_movies_featured (featured)
) ENGINE=InnoDB COMMENT='Tabel data film CineMax';


-- ============================================================
-- 4. TABEL MOVIE_GENRES (Relasi Film ↔ Genre / Many-to-Many)
-- ============================================================

CREATE TABLE movie_genres (
  movie_id  INT NOT NULL,
  genre_id  INT NOT NULL,

  PRIMARY KEY (movie_id, genre_id),
  FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Relasi many-to-many antara film dan genre';


-- ============================================================
-- 5. TABEL MOVIE_CAST (Data Pemain Film)
-- ============================================================

CREATE TABLE movie_cast (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  movie_id    INT             NOT NULL,
  actor_name  VARCHAR(150)    NOT NULL COMMENT 'Nama aktor/aktris',
  role_name   VARCHAR(150)    NULL COMMENT 'Nama karakter (opsional)',
  cast_order  INT             NOT NULL DEFAULT 0 COMMENT 'Urutan tampil',

  FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_cast_movie (movie_id)
) ENGINE=InnoDB COMMENT='Tabel data pemain/cast film';


-- ============================================================
-- 6. TABEL SHOWTIMES (Jadwal Tayang Film)
-- ============================================================

CREATE TABLE showtimes (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  movie_id    INT         NOT NULL,
  show_time   TIME        NOT NULL COMMENT 'Jam tayang (contoh: 10:00, 13:30)',
  studio      VARCHAR(50) NULL DEFAULT 'Studio 1' COMMENT 'Nama studio bioskop',

  FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_showtimes_movie (movie_id)
) ENGINE=InnoDB COMMENT='Jadwal jam tayang film';


-- ============================================================
-- 7. TABEL TICKETS (Data Pembelian Tiket)
-- ============================================================
-- Menyimpan semua transaksi pembelian tiket

CREATE TABLE tickets (
  id              VARCHAR(30)     PRIMARY KEY COMMENT 'ID Tiket unik (contoh: TIX1717900000000)',
  user_id         INT             NOT NULL COMMENT 'ID pengguna yang membeli',
  movie_id        INT             NOT NULL COMMENT 'ID film yang ditonton',
  movie_title     VARCHAR(255)    NOT NULL COMMENT 'Judul film (snapshot saat beli)',
  movie_poster    VARCHAR(500)    NULL COMMENT 'URL poster (snapshot saat beli)',
  showtime        TIME            NOT NULL COMMENT 'Jam tayang yang dipilih',
  show_date       DATE            NOT NULL COMMENT 'Tanggal nonton',
  seats           INT             NOT NULL DEFAULT 1 COMMENT 'Jumlah kursi dibeli',
  total_price     INT             NOT NULL DEFAULT 0 COMMENT 'Total harga tiket (price × seats)',
  status          ENUM('pending', 'confirmed', 'cancelled', 'expired')
                  NOT NULL DEFAULT 'pending' COMMENT 'Status tiket',
  purchase_date   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembelian',

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_tickets_user (user_id),
  INDEX idx_tickets_movie (movie_id),
  INDEX idx_tickets_status (status),
  INDEX idx_tickets_date (show_date)
) ENGINE=InnoDB COMMENT='Tabel transaksi pembelian tiket';


-- ============================================================
-- 8. TABEL TICKET_SEATS (Nomor Kursi per Tiket)
-- ============================================================
-- Menyimpan detail nomor kursi yang dipilih

CREATE TABLE ticket_seats (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id   VARCHAR(30)     NOT NULL,
  seat_number VARCHAR(10)     NOT NULL COMMENT 'Nomor kursi (contoh: A1, B5, C12)',

  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_seat_ticket (ticket_id),
  UNIQUE KEY uk_seat_per_show (ticket_id, seat_number)
) ENGINE=InnoDB COMMENT='Detail nomor kursi yang dibeli per tiket';


-- ============================================================
-- 9. TABEL RATINGS (Penilaian & Ulasan Film)
-- ============================================================
-- Menyimpan rating bintang dan review text dari pengguna

CREATE TABLE ratings (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT         NOT NULL COMMENT 'ID pengguna yang memberi rating',
  movie_id    INT         NOT NULL COMMENT 'ID film yang dirating',
  rating      TINYINT     NOT NULL COMMENT 'Nilai rating 1-5 bintang',
  review      TEXT        NULL COMMENT 'Teks ulasan (opsional)',
  user_name   VARCHAR(100) NOT NULL COMMENT 'Nama pengguna (snapshot)',
  created_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uk_user_movie_rating (user_id, movie_id) COMMENT '1 user hanya boleh 1 rating per film',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_ratings_movie (movie_id),
  INDEX idx_ratings_user (user_id),

  CONSTRAINT chk_rating_range CHECK (rating BETWEEN 1 AND 5)
) ENGINE=InnoDB COMMENT='Tabel penilaian dan ulasan film oleh pengguna';


-- ============================================================
-- 10. TABEL PAYMENTS (Data Pembayaran)
-- ============================================================
-- Menyimpan detail transaksi pembayaran untuk setiap tiket

CREATE TABLE payments (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id           VARCHAR(30)     NOT NULL COMMENT 'ID tiket yang dibayar',
  user_id             INT             NOT NULL COMMENT 'ID pengguna yang membayar',
  payment_method      ENUM('qris', 'bank_transfer', 'ewallet', 'credit_card')
                      NOT NULL COMMENT 'Metode pembayaran yang digunakan',
  payment_provider    VARCHAR(50)     NULL COMMENT 'Provider spesifik: BCA, Mandiri, GoPay, OVO, dll',
  subtotal            INT             NOT NULL DEFAULT 0 COMMENT 'Harga sebelum biaya & diskon',
  service_fee         INT             NOT NULL DEFAULT 3000 COMMENT 'Biaya layanan',
  discount_amount     INT             NOT NULL DEFAULT 0 COMMENT 'Jumlah potongan diskon',
  total_amount        INT             NOT NULL DEFAULT 0 COMMENT 'Total yang dibayar (subtotal + fee - discount)',
  promo_code          VARCHAR(30)     NULL COMMENT 'Kode promo yang digunakan (jika ada)',
  va_number           VARCHAR(30)     NULL COMMENT 'Nomor Virtual Account (untuk bank transfer)',
  card_last_four      VARCHAR(4)      NULL COMMENT '4 digit terakhir kartu kredit',
  status              ENUM('pending', 'success', 'failed', 'refunded')
                      NOT NULL DEFAULT 'pending' COMMENT 'Status pembayaran',
  paid_at             DATETIME        NULL COMMENT 'Waktu pembayaran berhasil',
  expired_at          DATETIME        NULL COMMENT 'Batas waktu pembayaran (15 menit)',
  created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_payments_ticket (ticket_id),
  INDEX idx_payments_user (user_id),
  INDEX idx_payments_status (status),
  INDEX idx_payments_method (payment_method)
) ENGINE=InnoDB COMMENT='Tabel transaksi pembayaran tiket';


-- ============================================================
-- 11. TABEL PROMO_CODES (Kode Promo / Diskon)
-- ============================================================

CREATE TABLE promo_codes (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  code            VARCHAR(30)     NOT NULL UNIQUE COMMENT 'Kode promo (contoh: CINEMAX20)',
  discount_pct    DECIMAL(5,2)    NOT NULL COMMENT 'Persentase diskon (0.10 = 10%, 0.20 = 20%)',
  is_active       TINYINT(1)      NOT NULL DEFAULT 1 COMMENT 'Apakah promo masih aktif',
  valid_from      DATETIME        NULL COMMENT 'Berlaku mulai tanggal',
  valid_until     DATETIME        NULL COMMENT 'Berlaku sampai tanggal',
  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_promo_code (code),
  CONSTRAINT chk_discount_range CHECK (discount_pct BETWEEN 0.01 AND 1.00)
) ENGINE=InnoDB COMMENT='Tabel kode promo dan diskon';


-- ============================================================
-- 12. TABEL WATCHLIST (Wishlist Film Pengguna)
-- ============================================================

CREATE TABLE watchlist (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  movie_id    INT NOT NULL,
  added_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY uk_user_movie_watchlist (user_id, movie_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_watchlist_user (user_id)
) ENGINE=InnoDB COMMENT='Tabel wishlist/watchlist film pengguna';


-- ============================================================
-- DATA AWAL (SEED DATA)
-- ============================================================

-- ---- Insert Admin ----
INSERT INTO users (name, email, password, role, avatar) VALUES
  ('Admin', 'admin@cinemax.com', '$2b$10$hashedpasswordAdmin123', 'admin', 'A');

-- ---- Insert Genre ----
INSERT INTO genres (name) VALUES
  ('Sci-Fi'), ('Drama'), ('Adventure'), ('History'),
  ('Action'), ('Crime'), ('Thriller'), ('Comedy'),
  ('Horror'), ('Animation'), ('Fantasy'), ('Romance'),
  ('Musical');

-- ---- Insert Film ----
INSERT INTO movies (id, title, year, duration, rating, price, description, poster, backdrop, trailer, director, featured, now_playing) VALUES
(1,  'Interstellar', 2014, 169, 8.6, 55000,
     'A team of explorers travel through a wormhole in space in an attempt to ensure humanity''s survival.',
     'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIe.jpg',
     'https://image.tmdb.org/t/p/original/xJHokMbljvjADYdit5fK5VQsXEG.jpg',
     'https://www.youtube.com/embed/zSWdZVtXT7E',
     'Christopher Nolan', 1, 1),

(2,  'Dune: Part Two', 2024, 166, 8.5, 65000,
     'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.',
     'https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg',
     'https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg',
     'https://www.youtube.com/embed/Way9Dexny3w',
     'Denis Villeneuve', 1, 1),

(3,  'Oppenheimer', 2023, 180, 8.4, 60000,
     'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.',
     'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
     'https://image.tmdb.org/t/p/original/rLb2cwF3Pazuxaj0sRXQ037tGI1.jpg',
     'https://www.youtube.com/embed/uYPbbksJxIg',
     'Christopher Nolan', 1, 1),

(4,  'The Batman', 2022, 176, 7.8, 55000,
     'When a serial killer targets Gotham''s elite with a series of sadistic machinations, Batman is forced to investigate the city''s hidden corruption.',
     'https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg',
     'https://image.tmdb.org/t/p/original/b0PlSFdDwbyK0cf5RxwDpaOJQvQ.jpg',
     'https://www.youtube.com/embed/mqqft2x_Aa4',
     'Matt Reeves', 0, 1),

(5,  'Avengers: Endgame', 2019, 181, 8.4, 50000,
     'After the devastating events of Infinity War, the Avengers assemble once more to undo Thanos'' actions and restore order to the universe.',
     'https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg',
     'https://image.tmdb.org/t/p/original/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg',
     'https://www.youtube.com/embed/TcMBFSGVi1c',
     'Anthony & Joe Russo', 0, 0),

(6,  'Inception', 2010, 148, 8.8, 45000,
     'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
     'https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg',
     'https://image.tmdb.org/t/p/original/s2bT29y0ngXxxu2IA8AOzzXTRhd.jpg',
     'https://www.youtube.com/embed/YoHD9XEInc0',
     'Christopher Nolan', 0, 0),

(7,  'Spider-Man: No Way Home', 2021, 148, 8.3, 60000,
     'With Spider-Man''s identity revealed, Peter asks Doctor Strange for help. When a spell goes wrong, dangerous foes from other worlds start to appear.',
     'https://image.tmdb.org/t/p/w500/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg',
     'https://image.tmdb.org/t/p/original/iQFcwSGbZXMkeyKrxbPnwnRo5fl.jpg',
     'https://www.youtube.com/embed/JfVOs4VSpmA',
     'Jon Watts', 1, 1),

(8,  'The Dark Knight', 2008, 152, 9.0, 45000,
     'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
     'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
     'https://image.tmdb.org/t/p/original/hkBaDkMWbLaf8B1lsWsKX7Ew3Xq.jpg',
     'https://www.youtube.com/embed/EXeTwQWrcwY',
     'Christopher Nolan', 1, 0),

(9,  'Parasite', 2019, 132, 8.5, 50000,
     'Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.',
     'https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg',
     'https://image.tmdb.org/t/p/original/TU9NIjwzjoKPwQHoHshkFcQUCG.jpg',
     'https://www.youtube.com/embed/5xH0HfJHsaY',
     'Bong Joon-ho', 0, 0),

(10, 'Everything Everywhere All at Once', 2022, 139, 7.8, 55000,
     'A middle-aged Chinese immigrant is swept up in an insane adventure where she alone can save the world by exploring other universes connecting with the lives she could have led.',
     'https://image.tmdb.org/t/p/w500/w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg',
     'https://image.tmdb.org/t/p/original/feSiISwgEpVzR1v3zv2n2AU4ANJ.jpg',
     'https://www.youtube.com/embed/wxN1T1uxQ2g',
     'Daniel Kwan & Daniel Scheinert', 0, 1),

(11, 'Top Gun: Maverick', 2022, 130, 8.3, 60000,
     'After more than thirty years of service as one of the Navy''s top aviators, Pete "Maverick" Mitchell is where he belongs, pushing the envelope as a courageous test pilot.',
     'https://image.tmdb.org/t/p/w500/62HCnUTziyWcpDaBO2i1DX17ljH.jpg',
     'https://image.tmdb.org/t/p/original/AkozGCHiJpITCIGBhGEBFMaZXfL.jpg',
     'https://www.youtube.com/embed/giXco2jaZ_4',
     'Joseph Kosinski', 1, 1),

(12, 'Black Panther: Wakanda Forever', 2022, 161, 6.9, 55000,
     'The people of Wakanda fight to protect their home from intervening world powers as they mourn the death of King T''Challa.',
     'https://image.tmdb.org/t/p/w500/sv1xJUazXoQuIDTqnVWt5CHmLCa.jpg',
     'https://image.tmdb.org/t/p/original/xDMIl84Qo5Tsu62c9DGWhmPI67A.jpg',
     'https://www.youtube.com/embed/_Z3QKkl1WyM',
     'Ryan Coogler', 0, 1),

(13, 'Avatar: The Way of Water', 2022, 192, 7.6, 75000,
     'Jake Sully lives with his newfound family formed on the planet of Pandora. Once a familiar threat returns to finish what was previously started, Jake must work with Neytiri.',
     'https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg',
     'https://image.tmdb.org/t/p/original/198vrF8k5UvCraM1njDRgCHNgxI.jpg',
     'https://www.youtube.com/embed/a8Gx8wiNbs8',
     'James Cameron', 1, 1),

(14, 'Doctor Strange in the Multiverse of Madness', 2022, 126, 6.9, 60000,
     'Doctor Strange teams with a mysterious teenager who can travel between multiverses to face a powerful enemy determined to harness their power.',
     'https://image.tmdb.org/t/p/w500/9Gtg2DzbZuKhp8E9qHMzGXv2tMO.jpg',
     'https://image.tmdb.org/t/p/original/H5HjE7Xb9N09rbWn1zBfxgI8uz.jpg',
     'https://www.youtube.com/embed/aWzlQ2N6qqg',
     'Sam Raimi', 0, 0),

(15, 'Guardians of the Galaxy Vol. 3', 2023, 150, 7.9, 60000,
     'Still reeling from the loss of Gamora, Peter Quill rallies his team to defend the universe and protect one of their own on a mission that could mean the end of the Guardians.',
     'https://image.tmdb.org/t/p/w500/r2J02Z2OpNTctfOSN1Ydgii51I3.jpg',
     'https://image.tmdb.org/t/p/original/nHf61UzkfFno5X1ofIjWpbVoQom.jpg',
     'https://www.youtube.com/embed/u3V5KDHRQvk',
     'James Gunn', 0, 1),

(16, 'Joker', 2019, 122, 8.4, 50000,
     'A mentally troubled stand-up comedian embarks on a downward spiral of revolution and bloody crime. This path brings him face-to-face with his alter-ego: "The Joker".',
     'https://image.tmdb.org/t/p/w500/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg',
     'https://image.tmdb.org/t/p/original/f5F4cRhQdUbyVbB5lTNCwURLTTa.jpg',
     'https://www.youtube.com/embed/zAGVQLHvwOY',
     'Todd Phillips', 1, 0),

(17, 'The Shawshank Redemption', 1994, 142, 9.3, 35000,
     'Over the course of several years, two convicts form a friendship, seeking consolation and, eventually, redemption through basic compassion.',
     'https://image.tmdb.org/t/p/w500/lyQBXzOQSuE59IsHyhrp0qIiPAz.jpg',
     'https://image.tmdb.org/t/p/original/kXfqcdQKsToO0OUXHcrrNCHDBzO.jpg',
     'https://www.youtube.com/embed/6hB3S9bIaco',
     'Frank Darabont', 0, 0),

(18, 'Spirited Away', 2001, 125, 8.6, 40000,
     'During her family''s move to the suburbs, a sullen 10-year-old girl wanders into a world ruled by gods, witches, and spirits, and where humans are changed into beasts.',
     'https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg',
     'https://image.tmdb.org/t/p/original/bSXfU4dwZyBA1vMmXvejdRXBvuF.jpg',
     'https://www.youtube.com/embed/ByXuk9QqQkk',
     'Hayao Miyazaki', 0, 0),

(19, 'La La Land', 2016, 128, 8.0, 45000,
     'While navigating their careers in Los Angeles, a pianist and an actress fall in love while attempting to reconcile their aspirations for the future.',
     'https://image.tmdb.org/t/p/w500/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg',
     'https://image.tmdb.org/t/p/original/nadTlnTE6DdgmYsN4iWd2SO1NDF.jpg',
     'https://www.youtube.com/embed/0pdqf4P9MB8',
     'Damien Chazelle', 0, 0),

(20, 'Mission: Impossible – Dead Reckoning', 2023, 163, 7.7, 65000,
     'Ethan Hunt and his IMF team must track down a terrifying new weapon that threatens all of humanity before it falls into the wrong hands.',
     'https://image.tmdb.org/t/p/w500/NNxYkU70HPurnNCSiCjYAmacwm.jpg',
     'https://image.tmdb.org/t/p/original/4GbFHsZVTw5sTaH2nMPFABuqFkX.jpg',
     'https://www.youtube.com/embed/avz06PDqgaM',
     'Christopher McQuarrie', 1, 1);


-- ---- Relasi Film ↔ Genre ----
INSERT INTO movie_genres (movie_id, genre_id) VALUES
-- Interstellar: Sci-Fi, Drama
(1, 1), (1, 2),
-- Dune: Part Two: Sci-Fi, Adventure
(2, 1), (2, 3),
-- Oppenheimer: Drama, History
(3, 2), (3, 4),
-- The Batman: Action, Crime
(4, 5), (4, 6),
-- Avengers: Endgame: Action, Sci-Fi
(5, 5), (5, 1),
-- Inception: Sci-Fi, Thriller
(6, 1), (6, 7),
-- Spider-Man: No Way Home: Action, Sci-Fi
(7, 5), (7, 1),
-- The Dark Knight: Action, Crime, Thriller
(8, 5), (8, 6), (8, 7),
-- Parasite: Thriller, Drama
(9, 7), (9, 2),
-- Everything Everywhere: Sci-Fi, Comedy, Action
(10, 1), (10, 8), (10, 5),
-- Top Gun: Maverick: Action, Drama
(11, 5), (11, 2),
-- Black Panther: Action, Sci-Fi
(12, 5), (12, 1),
-- Avatar: Sci-Fi, Adventure
(13, 1), (13, 3),
-- Doctor Strange: Action, Horror, Sci-Fi
(14, 5), (14, 9), (14, 1),
-- Guardians: Action, Comedy, Sci-Fi
(15, 5), (15, 8), (15, 1),
-- Joker: Crime, Drama, Thriller
(16, 6), (16, 2), (16, 7),
-- Shawshank: Drama, Crime
(17, 2), (17, 6),
-- Spirited Away: Animation, Fantasy, Adventure
(18, 10), (18, 11), (18, 3),
-- La La Land: Romance, Drama, Musical
(19, 12), (19, 2), (19, 13),
-- Mission Impossible: Action, Thriller
(20, 5), (20, 7);


-- ---- Data Pemain Film ----
INSERT INTO movie_cast (movie_id, actor_name, cast_order) VALUES
(1,  'Matthew McConaughey', 1), (1, 'Anne Hathaway', 2), (1, 'Jessica Chastain', 3),
(2,  'Timothée Chalamet', 1), (2, 'Zendaya', 2), (2, 'Rebecca Ferguson', 3),
(3,  'Cillian Murphy', 1), (3, 'Emily Blunt', 2), (3, 'Matt Damon', 3),
(4,  'Robert Pattinson', 1), (4, 'Zoë Kravitz', 2), (4, 'Paul Dano', 3),
(5,  'Robert Downey Jr.', 1), (5, 'Chris Evans', 2), (5, 'Scarlett Johansson', 3),
(6,  'Leonardo DiCaprio', 1), (6, 'Joseph Gordon-Levitt', 2), (6, 'Elliot Page', 3),
(7,  'Tom Holland', 1), (7, 'Zendaya', 2), (7, 'Benedict Cumberbatch', 3),
(8,  'Christian Bale', 1), (8, 'Heath Ledger', 2), (8, 'Aaron Eckhart', 3),
(9,  'Song Kang-ho', 1), (9, 'Lee Sun-kyun', 2), (9, 'Cho Yeo-jeong', 3),
(10, 'Michelle Yeoh', 1), (10, 'Stephanie Hsu', 2), (10, 'Ke Huy Quan', 3),
(11, 'Tom Cruise', 1), (11, 'Miles Teller', 2), (11, 'Jennifer Connelly', 3),
(12, 'Letitia Wright', 1), (12, 'Angela Bassett', 2), (12, 'Lupita Nyong''o', 3),
(13, 'Sam Worthington', 1), (13, 'Zoe Saldana', 2), (13, 'Sigourney Weaver', 3),
(14, 'Benedict Cumberbatch', 1), (14, 'Elizabeth Olsen', 2), (14, 'Chiwetel Ejiofor', 3),
(15, 'Chris Pratt', 1), (15, 'Zoe Saldana', 2), (15, 'Bradley Cooper', 3),
(16, 'Joaquin Phoenix', 1), (16, 'Robert De Niro', 2), (16, 'Zazie Beetz', 3),
(17, 'Tim Robbins', 1), (17, 'Morgan Freeman', 2), (17, 'Bob Gunton', 3),
(18, 'Daveigh Chase', 1), (18, 'Suzanne Pleshette', 2), (18, 'Miyu Irino', 3),
(19, 'Ryan Gosling', 1), (19, 'Emma Stone', 2), (19, 'John Legend', 3),
(20, 'Tom Cruise', 1), (20, 'Hayley Atwell', 2), (20, 'Ving Rhames', 3);


-- ---- Jadwal Tayang ----
INSERT INTO showtimes (movie_id, show_time) VALUES
(1,  '10:00'), (1,  '13:30'), (1,  '17:00'), (1,  '20:30'),
(2,  '11:00'), (2,  '14:30'), (2,  '18:00'), (2,  '21:30'),
(3,  '10:30'), (3,  '14:00'), (3,  '17:30'), (3,  '21:00'),
(4,  '12:00'), (4,  '15:30'), (4,  '19:00'), (4,  '22:30'),
(5,  '11:30'), (5,  '15:00'), (5,  '18:30'), (5,  '22:00'),
(6,  '10:00'), (6,  '13:00'), (6,  '16:00'), (6,  '19:00'),
(7,  '10:30'), (7,  '13:30'), (7,  '17:00'), (7,  '20:00'),
(8,  '11:00'), (8,  '14:00'), (8,  '18:00'), (8,  '21:00'),
(9,  '12:00'), (9,  '15:00'), (9,  '19:00'), (9,  '21:30'),
(10, '10:00'), (10, '13:00'), (10, '16:30'), (10, '20:00'),
(11, '11:30'), (11, '14:30'), (11, '18:00'), (11, '21:00'),
(12, '10:00'), (12, '13:00'), (12, '17:00'), (12, '20:30'),
(13, '10:00'), (13, '14:00'), (13, '18:00'), (13, '22:00'),
(14, '11:00'), (14, '14:00'), (14, '17:30'), (14, '21:00'),
(15, '10:30'), (15, '13:30'), (15, '17:00'), (15, '20:30'),
(16, '11:30'), (16, '15:00'), (16, '18:30'), (16, '21:30'),
(17, '12:00'), (17, '15:30'), (17, '19:00'),
(18, '10:00'), (18, '13:00'), (18, '16:00'),
(19, '11:00'), (19, '14:30'), (19, '18:00'), (19, '21:00'),
(20, '10:30'), (20, '13:30'), (20, '17:00'), (20, '21:00');


-- ---- Kode Promo ----
INSERT INTO promo_codes (code, discount_pct, is_active) VALUES
('CINEMAX20', 0.20, 1),
('HEMAT10',   0.10, 1),
('FILM50',    0.50, 1),
('NONTON',    0.15, 1);


-- ============================================================
-- VIEWS (Query Pembantu)
-- ============================================================

-- View: Rata-rata rating per film
CREATE OR REPLACE VIEW v_movie_ratings AS
SELECT
  m.id AS movie_id,
  m.title,
  COUNT(r.id) AS total_reviews,
  ROUND(AVG(r.rating), 1) AS avg_rating
FROM movies m
LEFT JOIN ratings r ON r.movie_id = m.id
GROUP BY m.id, m.title;

-- View: Ringkasan penjualan tiket per film
CREATE OR REPLACE VIEW v_movie_sales AS
SELECT
  m.id AS movie_id,
  m.title,
  COUNT(t.id) AS total_tickets_sold,
  SUM(t.seats) AS total_seats_sold,
  SUM(t.total_price) AS total_revenue
FROM movies m
LEFT JOIN tickets t ON t.movie_id = m.id AND t.status = 'confirmed'
GROUP BY m.id, m.title;

-- View: Riwayat pembelian lengkap per user
CREATE OR REPLACE VIEW v_user_purchase_history AS
SELECT
  u.id AS user_id,
  u.name AS user_name,
  u.email,
  t.id AS ticket_id,
  t.movie_title,
  t.show_date,
  t.showtime,
  t.seats,
  t.total_price,
  t.status AS ticket_status,
  p.payment_method,
  p.total_amount AS paid_amount,
  p.status AS payment_status,
  p.paid_at,
  t.purchase_date
FROM users u
JOIN tickets t ON t.user_id = u.id
LEFT JOIN payments p ON p.ticket_id = t.id
ORDER BY t.purchase_date DESC;

-- View: Pendapatan per metode pembayaran
CREATE OR REPLACE VIEW v_revenue_by_payment_method AS
SELECT
  payment_method,
  COUNT(*) AS total_transactions,
  SUM(total_amount) AS total_revenue,
  ROUND(AVG(total_amount), 0) AS avg_transaction
FROM payments
WHERE status = 'success'
GROUP BY payment_method;


-- ============================================================
-- SELESAI! Database CineMax siap digunakan.
-- ============================================================
