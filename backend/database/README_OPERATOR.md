# 📝 Panduan Membuat Akun Operator

Ada 3 cara untuk membuat akun operator:

## 🎯 **Cara 1: Menggunakan Seeder (DISARANKAN)**

Seeder akan otomatis hash password dan lebih aman.

### Langkah-langkah:

1. **Edit file seeder** `backend/database/seeders/create_operators.ts`
   - Tambahkan data operator yang ingin dibuat di array `operatorsToCreate`

2. **Jalankan seeder:**
   ```bash
   cd backend
   node ace db:seed
   ```

3. **Atau jalankan seeder spesifik:**
   ```bash
   node ace db:seed --files="database/seeders/create_operators.ts"
   ```

### Contoh data operator di seeder:
```typescript
const operatorsToCreate = [
  {
    username: 'operator1',
    email: 'operator1@bowar.com',
    password: 'operator123',
    warnetName: null, // null = gunakan warnet pertama
  },
  {
    username: 'operator_warnet_abc',
    email: 'operator.abc@bowar.com',
    password: 'password123',
    warnetName: 'Nama Warnet ABC', // Nama warnet spesifik
  },
]
```

---

## 🎯 **Cara 2: Menggunakan Command (PRAKTIS)**

Menggunakan Ace command untuk membuat operator langsung dari terminal.

### Langkah-langkah:

1. **Jalankan command:**
   ```bash
   cd backend
   node ace create:operator <username> <email> <password> --warnetId=1
   ```

2. **Atau dengan nama warnet:**
   ```bash
   node ace create:operator operator1 operator1@bowar.com password123 --warnetName="Nama Warnet"
   ```

### Contoh:
```bash
# Dengan ID warnet
node ace create:operator operator1 operator1@bowar.com operator123 --warnetId=1

# Dengan nama warnet
node ace create:operator operator2 operator2@bowar.com operator123 --warnetName="Warnet ABC"

# Tanpa specify warnet (akan menggunakan warnet pertama)
node ace create:operator operator3 operator3@bowar.com operator123
```

---

## 🎯 **Cara 3: Menggunakan Query SQL (LANGSUNG)**

⚠️ **PERINGATAN:** Password HARUS di-hash dengan scrypt sebelum di-insert!

### Langkah-langkah:

1. **Dapatkan hash password terlebih dahulu:**
   
   **Opsi A: Menggunakan AdonisJS REPL**
   ```bash
   cd backend
   node ace repl
   ```
   Lalu di REPL:
   ```javascript
   const hash = await import('@adonisjs/core/services/hash')
   await hash.default.make('password123')
   // Hasil: '$scrypt$...'
   ```

   **Opsi B: Menggunakan seeder untuk generate hash**
   - Buat seeder sementara atau gunakan cara 1/2 di atas

2. **Lihat daftar warnet yang ada:**
   ```sql
   SELECT id, name, address FROM warnets ORDER BY id;
   ```

3. **Insert operator dengan password yang sudah di-hash:**
   ```sql
   INSERT INTO users (
     username,
     email,
     password,
     role,
     warnet_id,
     bowar_wallet,
     created_at,
     updated_at
   ) VALUES (
     'operator1',
     'operator1@bowar.com',
     '$scrypt$...',  -- ⚠️ GANTI dengan hash password yang valid!
     'operator',
     1,              -- GANTI dengan ID warnet yang sesuai
     0,
     NOW(),
     NOW()
   );
   ```

4. **Cek operator yang sudah dibuat:**
   ```sql
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
   ```

---

## 📋 Checklist Setelah Membuat Operator

- [ ] Operator berhasil dibuat
- [ ] Username dan email unik
- [ ] Operator terhubung ke warnet yang benar
- [ ] Test login dengan kredensial operator
- [ ] **GANTI PASSWORD SETELAH LOGIN PERTAMA!** (sangat penting untuk keamanan)

---

## 🔍 Query Berguna

### Lihat semua operator:
```sql
SELECT 
  u.id,
  u.username,
  u.email,
  u.role,
  u.warnet_id,
  w.name AS warnet_name,
  u.created_at
FROM users u
LEFT JOIN warnets w ON u.warnet_id = w.id
WHERE u.role = 'operator'
ORDER BY u.id;
```

### Lihat warnet yang tersedia:
```sql
SELECT id, name, address FROM warnets ORDER BY id;
```

### Update password operator (harus di-hash dulu!):
```sql
UPDATE users 
SET password = '$scrypt$...',  -- Hash password baru
    updated_at = NOW()
WHERE username = 'operator1' AND role = 'operator';
```

### Hapus operator (hati-hati!):
```sql
DELETE FROM users 
WHERE username = 'operator1' AND role = 'operator';
```

---

## ⚠️ Catatan Keamanan

1. **Password harus di-hash** - Jangan pernah insert password plain text!
2. **Ganti password default** - Setelah login pertama, operator harus mengganti password
3. **Gunakan password kuat** - Minimal 8 karakter, kombinasi huruf, angka, dan simbol
4. **Jangan share kredensial** - Setiap operator harus punya akun sendiri

---

## 🆘 Troubleshooting

### Error: "Username sudah digunakan"
- Cek apakah username sudah ada di database
- Gunakan username yang berbeda

### Error: "Email sudah digunakan"
- Cek apakah email sudah ada di database
- Gunakan email yang berbeda

### Error: "Warnet tidak ditemukan"
- Pastikan warnet sudah dibuat terlebih dahulu
- Cek ID atau nama warnet yang digunakan

### Password tidak bisa login
- Pastikan password sudah di-hash dengan scrypt
- Gunakan cara 1 atau 2 (seeder/command) untuk hash otomatis
