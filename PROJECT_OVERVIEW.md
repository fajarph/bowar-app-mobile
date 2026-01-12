# 📋 Overview Lengkap Proyek Bowar App Mobile

## 🎯 Deskripsi Proyek

**Bowar** adalah aplikasi mobile booking warnet (warung internet) yang memungkinkan pengguna untuk:
- Mencari dan melihat detail warnet
- Booking PC dengan jadwal tertentu
- Membayar booking dengan berbagai metode (DompetBowar, e-wallet, transfer bank)
- Mengelola saldo wallet (DompetBowar & Cafe Wallet untuk member)
- Operator dapat mengelola bookings, members, dan topups

---

## 🏗️ Arsitektur Aplikasi

### **Stack Teknologi**

#### **Frontend**
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite 7
- **Routing**: React Router DOM
- **Styling**: Tailwind CSS + Custom CSS
- **UI Components**: Radix UI (shadcn/ui)
- **State Management**: React Context API
- **HTTP Client**: Axios
- **PWA Support**: Vite PWA Plugin
- **Form Handling**: React Hook Form

#### **Backend**
- **Framework**: AdonisJS 6 (Node.js)
- **ORM**: Lucid ORM
- **Database**: PostgreSQL
- **Authentication**: AdonisJS Auth (Access Tokens)
- **Validation**: VineJS
- **Password Hashing**: Scrypt

---

## 📁 Struktur Folder dan File

### **Root Structure**
```
bowar-app-mobile/
├── backend/          # Backend API (AdonisJS)
├── frontend/         # Frontend App (React + Vite)
├── IMPLEMENTATION_ROADMAP.md
└── PROJECT_OVERVIEW.md (ini)
```

---

### **📂 Backend Structure** (`backend/`)

```
backend/
├── app/
│   ├── controllers/          # Business logic handlers
│   │   ├── auth/
│   │   │   ├── login_controller.ts
│   │   │   └── register_controller.ts
│   │   ├── bowar_transaction_controller.ts  # DompetBowar transactions
│   │   ├── cafe_wallet_controller.ts        # Cafe wallet management
│   │   ├── operator_controller.ts           # Operator dashboard
│   │   ├── user_controller.ts               # User profile management
│   │   └── warnetController.ts              # Warnet CRUD
│   │
│   ├── models/              # Database models (ORM)
│   │   ├── booking.ts
│   │   ├── bowar_transaction.ts
│   │   ├── cafe_wallet.ts
│   │   ├── chat_message.ts
│   │   ├── payment.ts
│   │   ├── pc.ts
│   │   ├── rule.ts
│   │   ├── user.ts
│   │   └── warnet.ts
│   │
│   ├── middleware/          # HTTP middleware
│   │   ├── auth_middleware.ts
│   │   ├── container_bindings_middleware.ts
│   │   └── force_json_response_middleware.ts
│   │
│   └── validators/          # Request validation
│       ├── loginValidator.ts
│       └── registerValidator.ts
│
├── database/
│   ├── migrations/          # Database schema migrations
│   ├── seeders/             # Database seeders
│   │   └── create_operators.ts
│   └── queries/             # SQL queries
│
├── start/
│   ├── routes.ts            # API routes definition
│   ├── kernel.ts            # Middleware registration
│   └── env.ts               # Environment variables
│
├── config/                  # Configuration files
│   ├── app.ts
│   ├── auth.ts
│   ├── database.ts
│   └── ...
│
├── bin/
│   ├── server.ts            # Server entry point
│   └── console.ts
│
├── commands/                # Ace commands
│   └── create_operator.ts
│
├── adonisrc.ts             # AdonisJS configuration
├── package.json
└── tsconfig.json
```

---

### **📂 Frontend Structure** (`frontend/`)

```
frontend/
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # Reusable UI components (shadcn/ui)
│   │   ├── operator/       # Operator-specific screens
│   │   │   ├── OperatorBookings.tsx
│   │   │   ├── OperatorBottomNav.tsx
│   │   │   ├── OperatorDashboard.tsx
│   │   │   ├── OperatorLoginScreen.tsx
│   │   │   ├── OperatorMembers.tsx
│   │   │   ├── OperatorPCGrid.tsx
│   │   │   ├── OperatorTopups.tsx
│   │   │   └── OperatorTopupConfirmScreen.tsx
│   │   │
│   │   ├── ActiveSessionScreen.tsx      # Active gaming session
│   │   ├── BookingDetailScreen.tsx      # Booking details
│   │   ├── BookingHistoryScreen.tsx     # Booking history
│   │   ├── BookingPaymentScreen.tsx     # Payment for booking
│   │   ├── BookingScreen.tsx            # Create booking
│   │   ├── BottomNav.tsx                # Bottom navigation
│   │   ├── CafeDetailsScreen.tsx        # Warnet details
│   │   ├── ChatScreen.tsx               # Chat feature
│   │   ├── DompetBowarScreen.tsx        # DompetBowar wallet
│   │   ├── EditProfileScreen.tsx        # Edit profile
│   │   ├── HomeScreen.tsx               # Home/Dashboard
│   │   ├── LoginScreen.tsx              # User login
│   │   ├── MapScreen.tsx                # Map view
│   │   ├── MapsScreen.tsx               # Maps (alternative)
│   │   ├── NeonLogin.tsx                # Alternative login UI
│   │   ├── PCAvailabilityScreen.tsx     # PC availability
│   │   ├── PCLoginScreen.tsx            # PC login
│   │   ├── PaymentScreen.tsx            # Payment screen
│   │   ├── ProfileScreen.tsx            # User profile
│   │   ├── RegisterScreen.tsx           # User registration
│   │   ├── RulesScreen.tsx              # Warnet rules
│   │   └── WarnetDetailScreen.tsx       # Warnet details (alt)
│   │
│   ├── contexts/
│   │   └── AppContext.tsx               # Global state management
│   │
│   ├── services/
│   │   └── api.ts                       # API service layer
│   │
│   ├── styles/
│   │   └── globals.css                  # Global styles
│   │
│   ├── guidelines/
│   │   └── Guidelines.md
│   │
│   ├── App.tsx                          # Main app component + routing
│   ├── main.tsx                         # App entry point
│   └── index.css                        # Base styles
│
├── public/                              # Static assets
│   ├── pwa-192x192.png
│   ├── pwa-512x512.png
│   └── vite.svg
│
├── vite.config.ts                       # Vite configuration
├── tsconfig.json                        # TypeScript config
├── package.json
└── README.md
```

---

## 🔐 Sistem Autentikasi & User Roles

### **Tipe User**

1. **Regular User** (`role: 'user'`)
   - User biasa
   - Tidak bisa simpan waktu main (tidak punya cafe wallet)
   - Bisa booking dan bayar langsung

2. **Member** (`role: 'member'`)
   - User member (terdaftar di warnet tertentu)
   - Bisa simpan waktu main di **Cafe Wallet**
   - Minimal durasi booking > 1 jam
   - Dapat harga member (lebih murah)

3. **Operator** (`role: 'operator'`)
   - Staff warnet
   - Mengelola bookings, members, topups
   - Approve/reject topup DompetBowar
   - Monitor PC status

### **Autentikasi Flow**

1. **Register**
   - `/register/user` - Register user biasa
   - `/register/member` - Register member (perlu `warnet_id`)
   - Operator dibuat oleh admin (tidak bisa self-register)

2. **Login**
   - `/login` - Unified login endpoint
   - Mengembalikan `token` (access token) dan `user` object
   - Token disimpan di `localStorage` sebagai `auth_token`

3. **Protected Routes**
   - Menggunakan middleware `auth()` di backend
   - Token dikirim via header: `Authorization: Bearer <token>`
   - Frontend menggunakan axios interceptor untuk inject token

---

## 💰 Sistem Wallet

### **1. DompetBowar** (Global Wallet)
- **Lokasi**: Field `bowar_wallet` di table `users`
- **Fungsi**: Wallet global untuk semua transaksi
- **Features**:
  - Top up via transfer bank (perlu approval operator)
  - Payment booking
  - Refund
- **Transaction Types**: `topup`, `payment`, `refund`
- **Status**: `pending`, `completed`, `failed`
- **Model**: `BowarTransaction`

### **2. Cafe Wallet** (Member Wallet)
- **Lokasi**: Table `cafe_wallets`
- **Fungsi**: Wallet per-warnet untuk member
- **Fields**:
  - `remaining_minutes`: Sisa waktu dalam menit
  - `is_active`: Status aktif (saat user login di PC)
  - `warnet_id`: ID warnet
- **Features**:
  - Menyimpan waktu main member
  - Countdown real-time saat aktif
  - Auto-deduct saat session aktif
- **Model**: `CafeWallet`

---

## 📊 Database Schema

### **Core Tables**

#### **1. users**
```sql
- id (PK)
- username
- email
- password (hashed)
- role: 'user' | 'member' | 'operator'
- warnet_id (FK, nullable - untuk member/operator)
- bowar_wallet (decimal) - Saldo DompetBowar
- avatar (string, nullable)
- created_at, updated_at
```

#### **2. warnets**
```sql
- id (PK)
- name
- address
- description
- regular_price_per_hour
- member_price_per_hour
- total_pcs
- phone, email, operating_hours
- latitude, longitude (untuk maps)
- image (URL)
- bank_account_number, bank_account_name
- created_at, updated_at
```

#### **3. pcs**
```sql
- id (PK)
- warnet_id (FK)
- pc_number
- status: 'available' | 'occupied' | 'maintenance'
- current_booking_id (FK, nullable)
- created_at, updated_at
```

#### **4. bookings**
```sql
- id (PK)
- user_id (FK)
- warnet_id (FK)
- pc_number
- booking_date (date)
- booking_time (string)
- duration (hours)
- status: 'pending' | 'active' | 'completed' | 'cancelled'
- payment_status: 'pending' | 'paid' | 'rejected'
- session_start_time (datetime, nullable)
- session_end_time (datetime, nullable)
- is_session_active (boolean)
- price_per_hour
- total_price
- is_member_booking (boolean)
- can_cancel_until (datetime, nullable) - 2 menit window
- created_at, updated_at
```

#### **5. payments**
```sql
- id (PK)
- booking_id (FK)
- payment_method: 'gopay' | 'ovo' | 'dana' | ...
- amount
- status: 'pending' | 'approved' | 'rejected'
- approved_by (FK users, nullable)
- approved_at (datetime, nullable)
- notes, transaction_reference
- created_at, updated_at
```

#### **6. cafe_wallets**
```sql
- id (PK)
- user_id (FK)
- warnet_id (FK)
- remaining_minutes (integer)
- is_active (boolean)
- last_updated (datetime)
- created_at, updated_at
```

#### **7. bowar_transactions**
```sql
- id (PK)
- user_id (FK)
- type: 'topup' | 'payment' | 'refund'
- amount (decimal, bisa negative untuk payment)
- description
- booking_id (FK, nullable)
- status: 'pending' | 'completed' | 'failed'
- proof_image (string, nullable) - untuk topup
- sender_name (string, nullable)
- approved_by (FK users, nullable) - untuk topup approval
- approved_at (datetime, nullable)
- rejection_note (string, nullable)
- created_at, updated_at
```

#### **8. rules**
```sql
- id (PK)
- warnet_id (FK)
- rule_text (string)
- created_at, updated_at
```

#### **9. chat_messages**
```sql
- id (PK)
- user_id (FK)
- warnet_id (FK)
- sender_id (FK users)
- message (text)
- created_at, updated_at
```

---

## 🔄 Alur Aplikasi (Flow)

### **Flow 1: User Registration & Login**

```
1. User pilih register (user/member)
   ↓
2. Input: username, email, password
   (Member: + warnet_id)
   ↓
3. POST /register/user atau /register/member
   ↓
4. Backend create user, hash password
   ↓
5. Return success → Login screen
   ↓
6. Login dengan username/password
   ↓
7. POST /login → Return token + user
   ↓
8. Save token & user ke localStorage
   ↓
9. Navigate ke HomeScreen
```

### **Flow 2: Booking PC**

```
1. HomeScreen → List warnets (GET /warnets)
   ↓
2. User pilih warnet → CafeDetailsScreen
   ↓
3. Lihat detail warnet (GET /warnets/:id)
   ↓
4. Pilih "Lihat PC" → PCAvailabilityScreen
   ↓
5. User pilih PC available → BookingScreen
   ↓
6. Input: tanggal, jam, durasi
   (Validasi: member minimal > 1 jam)
   ↓
7. Submit → PaymentScreen
   ↓
8. Pilih payment method:
   - DompetBowar (deduct langsung jika saldo cukup)
   - E-wallet/Transfer (perlu approval operator)
   ↓
9. Create booking + payment
   ↓
10. Payment approved → Booking active
    ↓
11. User bisa cancel dalam 2 menit (can_cancel_until)
    ↓
12. Setelah 2 menit → Booking locked
```

### **Flow 3: DompetBowar Topup**

```
1. ProfileScreen → DompetBowarScreen
   ↓
2. Input: amount, upload proof image, sender name
   ↓
3. POST /bowar-transactions/topup
   ↓
4. Status: pending
   ↓
5. Operator lihat di OperatorTopups screen
   ↓
6. Operator approve/reject
   ↓
7. PATCH /bowar-transactions/:id/approve
   ↓
8. Backend: Update user.bowar_wallet += amount
   ↓
9. Transaction status → completed
```

### **Flow 4: Member Cafe Wallet**

```
1. Member register dengan warnet_id
   ↓
2. Member melakukan payment booking
   ↓
3. Jika approved → Waktu ditambahkan ke Cafe Wallet
   (POST /cafe-wallets atau update existing)
   ↓
4. Member login di PC warnet
   ↓
5. POST /cafe-wallets/:id/activate
   ↓
6. Wallet is_active = true
   ↓
7. Real-time countdown (frontend + backend sync)
   ↓
8. Member logout → POST /cafe-wallets/:id/deactivate
   ↓
9. Wallet is_active = false
```

### **Flow 5: Operator Dashboard**

```
1. Operator login → OperatorLoginScreen
   ↓
2. Authenticate → Save operator ke localStorage
   ↓
3. OperatorDashboard
   - Statistics (GET /operator/warnet/:id/statistics)
   - Members (GET /operator/warnet/:id/members)
   ↓
4. OperatorPCGrid
   - Monitor PC status real-time
   ↓
5. OperatorTopups
   - List pending topups (GET /bowar-transactions?status=pending&type=topup)
   - Approve/Reject (PATCH /bowar-transactions/:id/approve|reject)
   ↓
6. OperatorBookings
   - List all bookings untuk warnet
```

---

## 🛣️ API Endpoints

### **Authentication**
- `POST /register/user` - Register user biasa
- `POST /register/member` - Register member
- `POST /login` - Login (unified)

### **Warnets**
- `GET /warnets` - List semua warnet
- `GET /warnets/:id` - Detail warnet
- `GET /warnets/:id/rules` - Rules warnet

### **User Profile** (Protected)
- `GET /profile` - Get user profile + cafe wallets
- `PATCH /profile` - Update profile
- `GET /profile/wallets` - Get cafe wallets
- `GET /profile/all-memberships` - Get all memberships

### **Cafe Wallets** (Protected)
- `GET /cafe-wallets` - List semua cafe wallets user
- `GET /cafe-wallets/:warnetId` - Get wallet untuk warnet tertentu
- `POST /cafe-wallets` - Create/update wallet (add time)
- `PATCH /cafe-wallets/:id/activate` - Activate wallet (login PC)
- `PATCH /cafe-wallets/:id/deactivate` - Deactivate wallet (logout PC)
- `PATCH /cafe-wallets/:id/update-time` - Update remaining time

### **Bowar Transactions** (Protected)
- `GET /bowar-transactions` - List transactions (with filters)
- `GET /bowar-transactions/:id` - Transaction detail
- `POST /bowar-transactions/topup` - Top up DompetBowar
- `POST /bowar-transactions/payment` - Payment via DompetBowar
- `POST /bowar-transactions/refund` - Refund
- `PATCH /bowar-transactions/:id/approve` - Approve topup (operator)
- `PATCH /bowar-transactions/:id/reject` - Reject topup (operator)

### **Operator** (Protected)
- `GET /operator/warnet/:warnetId/members` - List members
- `GET /operator/warnet/:warnetId/statistics` - Get statistics

---

## 🎨 Frontend Architecture

### **State Management**

Menggunakan **React Context API** untuk global state:

```typescript
AppContext menyediakan:
- user: User | null
- operator: Operator | null
- cafes: Cafe[]
- bookings: Booking[]
- pcStatuses: { [cafeId: string]: PCStatus[] }
- chatMessages: { [cafeId: string]: ChatMessage[] }
- Functions: addBooking, updateWallet, etc.
```

### **Routing**

Menggunakan **React Router DOM**:

**Public Routes:**
- `/login` - Login screen
- `/register` - Register screen
- `/neon-login` - Alternative login UI

**Protected Routes (User):**
- `/home` - Home/Dashboard
- `/cafe/:cafeId` - Warnet details
- `/booking/:cafeId/:pcNumber` - Create booking
- `/payment/:bookingId` - Payment screen
- `/booking-history` - Booking history
- `/profile` - User profile
- `/dompet-bowar` - DompetBowar wallet
- `/map` - Map view

**Protected Routes (Operator):**
- `/operator/login` - Operator login
- `/operator/dashboard` - Operator dashboard
- `/operator/pc-grid` - PC status grid
- `/operator/bookings` - Bookings management
- `/operator/members` - Members list
- `/operator/topups` - Topup approvals

### **API Service Layer**

File `services/api.ts`:
- Centralized axios instance
- Request/response interceptors
- Token injection
- Error handling
- All API functions exported

---

## 🔒 Security Features

1. **Password Hashing**: Scrypt (AdonisJS default)
2. **Token-based Auth**: Access tokens (JWT-like)
3. **Middleware Protection**: Protected routes menggunakan `auth()` middleware
4. **Input Validation**: VineJS validators
5. **CORS**: Configured di backend
6. **Operator Creation**: Hanya admin, tidak bisa self-register

---

## 📱 PWA Features

- Service Worker (via Vite PWA)
- Offline support
- Install prompt
- Icons (192x192, 512x512)
- Manifest configuration

---

## 🚀 Development Workflow

### **Backend**
```bash
cd backend
npm install
npm run dev          # Start dev server (port 3333)
npm run build        # Build for production
npm run test         # Run tests
node ace db:migrate  # Run migrations
node ace db:seed     # Run seeders
```

### **Frontend**
```bash
cd frontend
npm install
npm run dev          # Start dev server (port 5173)
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### **Environment Variables**

**Backend** (`.env`):
```
PORT=3333
HOST=0.0.0.0
APP_KEY=...          # AdonisJS app key
DB_CONNECTION=pg
DB_HOST=localhost
DB_PORT=5432
DB_USER=...
DB_PASSWORD=...
DB_DATABASE=...
```

**Frontend** (`.env`):
```
VITE_API_URL=http://localhost:3333
```

---

## 📝 Catatan Penting

1. **Member Booking Rule**: Member minimal durasi > 1 jam (validasi di backend)
2. **Cancel Window**: User bisa cancel booking dalam 2 menit setelah payment (can_cancel_until)
3. **PC Status**: Real-time update saat booking dibuat/updated
4. **Payment Flow**: 
   - DompetBowar → Deduct langsung jika saldo cukup
   - E-wallet/Transfer → Perlu approval operator
5. **Cafe Wallet**: Hanya untuk member, menyimpan waktu dalam menit
6. **DompetBowar**: Wallet global, bisa topup via transfer (perlu approval)

---

## 🔍 Key Concepts

### **Booking Status Flow**
```
pending → active → completed
   ↓
cancelled (jika cancel dalam 2 menit)
```

### **Payment Status Flow**
```
pending → approved → (booking menjadi active)
   ↓
rejected
```

### **PC Status**
- `available`: PC tersedia untuk booking
- `occupied`: PC sedang digunakan
- `maintenance`: PC dalam maintenance

### **Session Management**
- `is_session_active`: Flag apakah session sedang aktif
- `session_start_time`: Waktu mulai session
- Real-time countdown di frontend
- Auto-deduct dari Cafe Wallet (untuk member)

---

## 📚 File-file Penting

1. **Backend Routes**: `backend/start/routes.ts`
2. **Frontend Routing**: `frontend/src/App.tsx`
3. **API Service**: `frontend/src/services/api.ts`
4. **Global State**: `frontend/src/contexts/AppContext.tsx`
5. **User Model**: `backend/app/models/user.ts`
6. **Booking Model**: `backend/app/models/booking.ts`
7. **Roadmap**: `IMPLEMENTATION_ROADMAP.md`

---

## 🎯 Next Steps / TODO

Lihat `IMPLEMENTATION_ROADMAP.md` untuk detail roadmap implementasi.

Beberapa fitur yang mungkin masih dalam development:
- Booking endpoints (create, cancel, history)
- Payment endpoints (create, approve/reject)
- Real-time PC status updates
- Chat feature implementation
- Map integration

---

*Dokumen ini dibuat untuk memahami struktur dan alur proyek Bowar App Mobile secara komprehensif.*
