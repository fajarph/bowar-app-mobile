-- ============================================
-- QUERY SQL UNTUK MEMBUAT AKUN OPERATOR
-- ============================================
-- 
-- CATATAN PENTING:
-- 1. Password HARUS di-hash menggunakan scrypt sebelum di-insert
-- 2. AdonisJS menggunakan scrypt untuk hash password
-- 3. Lebih baik gunakan seeder (create_operators.ts) yang akan hash password otomatis
-- 4. Jika menggunakan query ini, pastikan password sudah di-hash dengan format: $scrypt$...
--
-- Cara mendapatkan hash password:
-- - Gunakan seeder: node ace db:seed
-- - Atau gunakan AdonisJS REPL: node ace repl
--   > const hash = await import('@adonisjs/core/services/hash')
--   > await hash.default.make('password123')
--   > Hasil: '$scrypt$...'
--
-- ============================================

-- Contoh 1: Membuat operator untuk warnet dengan ID 1
-- GANTI 'password_hash_disini' dengan hash password yang valid
INSERT INTO users (
  username,
  email,
  password,
  role,
  warnet_id,
  bowar_wallet,
  avatar,
  created_at,
  updated_at
) VALUES (
  'operator1',                    -- Username operator
  'operator1@bowar.com',          -- Email operator
  'password_hash_disini',          -- ⚠️ HARUS hash password dengan scrypt!
  'operator',                     -- Role harus 'operator'
  1,                              -- warnet_id (ganti dengan ID warnet yang sesuai)
  0,                              -- bowar_wallet (default 0)
  NULL,                           -- avatar (optional)
  NOW(),                          -- created_at
  NOW()                           -- updated_at
);

-- Contoh 2: Membuat operator untuk warnet dengan ID 2
INSERT INTO users (
  username,
  email,
  password,
  role,
  warnet_id,
  bowar_wallet,
  avatar,
  created_at,
  updated_at
) VALUES (
  'operator2',
  'operator2@bowar.com',
  'password_hash_disini',          -- ⚠️ HARUS hash password dengan scrypt!
  'operator',
  2,                              -- warnet_id berbeda
  0,
  NULL,
  NOW(),
  NOW()
);

-- ============================================
-- QUERY UNTUK MENGECEK WARNET YANG ADA
-- ============================================
-- Jalankan query ini terlebih dahulu untuk melihat ID warnet yang tersedia
SELECT id, name, address FROM warnets ORDER BY id;

-- ============================================
-- QUERY UNTUK MENGECEK OPERATOR YANG SUDAH ADA
-- ============================================
SELECT 
  u.id,
  u.username,
  u.email,
  u.role,
  u.warnet_id,
  w.name AS warnet_name
FROM users u
LEFT JOIN warnets w ON u.warnet_id = w.id
WHERE u.role = 'operator'
ORDER BY u.id;

-- ============================================
-- QUERY UNTUK UPDATE PASSWORD OPERATOR
-- ============================================
-- Jika perlu mengubah password operator (harus di-hash dulu!)
-- UPDATE users 
-- SET password = 'password_hash_baru_disini',
--     updated_at = NOW()
-- WHERE username = 'operator1' AND role = 'operator';

-- ============================================
-- QUERY UNTUK HAPUS OPERATOR (HATI-HATI!)
-- ============================================
-- DELETE FROM users 
-- WHERE username = 'operator1' AND role = 'operator';
