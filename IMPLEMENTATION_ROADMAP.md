# Roadmap Implementasi Aplikasi Booking Warnet

## 📋 Flow Bisnis yang Telah Dipahami

### 1. **Login/Register System**
- ✅ 3 tipe user: `user biasa`, `member`, `operator`
- ✅ User biasa: tidak bisa simpan waktu main
- ✅ Member: bisa simpan waktu main (wallet system)
- ✅ Register sudah terintegrasi backend

### 2. **Bisnis Proses Booking**

#### Step 1: Pilih Warnet
- User melihat list warnet
- User bisa lihat detail warnet:
  - Fasilitas
  - Deskripsi
  - Jumlah PC
  - Harga per jam (regular & member)
  - Lokasi

#### Step 2: Booking PC
- User melihat status PC:
  - ✅ Tersedia (available)
  - ❌ Tidak tersedia (occupied)
  - 🔵 Sedang dipilih (selected)
- User memilih PC yang tersedia

#### Step 3: Detail Booking
- User input:
  - 📅 Tanggal main
  - 🕐 Jam main
  - ⏱️ Durasi main
- **Aturan khusus Member:**
  - ❌ Tidak bisa hanya 1 jam
  - ✅ Minimal lebih dari 1 jam (misal: 2 jam)

#### Step 4: Payment Method
- User pilih metode pembayaran
- Payment masuk ke operator untuk **approval**

#### Step 5: Approval Operator
- Operator review payment
- Operator approve/reject
- Jika approved → masuk ke history booking

#### Step 6: History Booking
- User lihat history booking
- **Cancel Window:** User bisa cancel dalam **2 menit**
- Jika lewat 2 menit → billing otomatis masuk

---

## 🚀 Endpoint Backend yang Perlu Dibuat

### **Warnet Endpoints**
1. `GET /warnets` - List semua warnet
2. `GET /warnets/:id` - Detail warnet (fasilitas, harga, dll)
3. `GET /warnets/:id/pcs` - Status PC warnet (tersedia/tidak tersedia)

### **Booking Endpoints**
4. `POST /bookings` - Create booking
   - Validasi: member minimal 2 jam
   - Simpan: tanggal, jam, durasi, PC number
5. `GET /bookings/history` - History booking user
6. `GET /bookings/:id` - Detail booking
7. `POST /bookings/:id/cancel` - Cancel booking (validasi 2 menit)
8. `PATCH /bookings/:id/status` - Update status (active/completed/cancelled)

### **Payment Endpoints**
9. `POST /payments` - Create payment
   - Simpan metode pembayaran
   - Status: pending → waiting approval
10. `GET /payments` - List payments (untuk operator)
11. `PATCH /payments/:id/approve` - Operator approve payment
12. `PATCH /payments/:id/reject` - Operator reject payment

### **Auth Endpoints**
13. ✅ `POST /register/user` - Register user biasa (DONE)
14. ✅ `POST /register/member` - Register member (DONE)
15. ✅ `POST /login` - Login (DONE)
16. `GET /profile` - Get user profile
17. `PATCH /profile` - Update profile

---

## 📝 Database Schema yang Perlu

### **Table: warnets** ✅ (Sudah ada)
- id, name, address, description, timestamps

### **Table: users** ✅ (Sudah ada)
- id, username, email, password, role, warnet_id, timestamps

### **Table: bookings** (Perlu dibuat)
```sql
- id
- user_id (FK users)
- warnet_id (FK warnets)
- pc_number
- booking_date
- booking_time
- duration (jam)
- status (pending/active/completed/cancelled)
- payment_status (pending/paid/rejected)
- created_at (untuk hitung 2 menit cancel window)
- timestamps
```

### **Table: payments** (Perlu dibuat)
```sql
- id
- booking_id (FK bookings)
- payment_method
- amount
- status (pending/approved/rejected)
- approved_by (FK users - operator)
- approved_at
- timestamps
```

### **Table: pcs** (Perlu dibuat)
```sql
- id
- warnet_id (FK warnets)
- pc_number
- status (available/occupied/maintenance)
- current_booking_id (FK bookings, nullable)
- timestamps
```

---

## 🎯 Prioritas Implementasi

### **Phase 1: Foundation (Penting)**
1. ✅ Register/Login backend integration
2. ⏳ Get list warnet (untuk dropdown & home)
3. ⏳ Get detail warnet
4. ⏳ Get PC status

### **Phase 2: Booking System**
5. ⏳ Create booking (dengan validasi member)
6. ⏳ History booking
7. ⏳ Cancel booking (dengan timer 2 menit)

### **Phase 3: Payment & Approval**
8. ⏳ Create payment
9. ⏳ Operator approval system
10. ⏳ Update booking setelah payment approved

### **Phase 4: Operator Dashboard**
11. ⏳ List payments pending approval
12. ⏳ Approve/reject payment
13. ⏳ Monitor PC status

---

## 💡 Catatan Penting

1. **Member Booking Rule:**
   - Minimal durasi > 1 jam (misal: 2 jam)
   - Validasi di backend saat create booking

2. **Cancel Window:**
   - User bisa cancel dalam 2 menit setelah payment
   - Hitung dari `created_at` payment
   - Jika lewat → billing otomatis masuk

3. **PC Status:**
   - Real-time update saat booking dibuat
   - Update status saat session mulai/selesai

4. **Payment Flow:**
   - User pilih payment method → Status: `pending`
   - Operator review → Approve/Reject
   - Jika approved → Update booking status jadi `active`

---

## ❓ Pertanyaan untuk Klarifikasi

1. **Durasi minimal member:** Apakah 2 jam atau bisa dikonfigurasi per warnet?
2. **PC Assignment:** Apakah user pilih PC manual atau auto-assign?
3. **Billing Start:** Kapan billing mulai? Setelah approval atau saat user login di warnet?
4. **Member Wallet:** Apakah waktu tersimpan member akan otomatis terpakai saat booking?

