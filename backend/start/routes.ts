/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'

const RegisterController = () => import('../app/controllers/auth/register_controller.js')
const LoginController = () => import('../app/controllers/auth/login_controller.js')
const WarnetController = () => import('../app/controllers/warnetController.js')
const UserController = () => import('../app/controllers/user_controller.js')
const CafeWalletController = () => import('../app/controllers/cafe_wallet_controller.js')
const BowarTransactionController = () =>
  import('../app/controllers/bowar_transaction_controller.js')
const OperatorController = () => import('../app/controllers/operator_controller.js')
const BookingController = () => import('../app/controllers/booking_controller.js')
const OperatorBookingsController = () => import('../app/controllers/operator_bookings_controller.js')
const ChatController = () => import('../app/controllers/chat_controller.js')

router.get('/', async () => {
  return {
    hello: 'JENONKKKKK',
  }
})

// Auth Routes
// Register
router.post('/register/user', [RegisterController, 'registerUser'])
router.post('/register/member', [RegisterController, 'registerMember'])
// Operator registration removed - operators should be created by admin only
// router.post('/register/operator', [RegisterController, 'registerOperator'])

// Login (consistency with register: separate endpoints)
// router.post('/login/user', [LoginController, 'loginUser'])
// router.post('/login/member', [LoginController, 'loginMember'])
// Keep unified login endpoint for backward compatibility
router.post('/login', [LoginController, 'login'])

// Protected routes
// router.get('/profile', [LoginController, 'profile']).use(middleware.auth())
// router.post('/logout', [LoginController, 'logout']).use(middleware.auth())

// Warnet Routes
router.get('/warnets', [WarnetController, 'index'])
router.get('/warnets/:id', [WarnetController, 'show'])
router.get('/warnets/:id/rules', [WarnetController, 'rules'])

// User Routes (Protected)
router.get('/profile', [UserController, 'profile']).use(middleware.auth())
router.patch('/profile', [UserController, 'update']).use(middleware.auth())
router.get('/profile/wallets', [UserController, 'wallets']).use(middleware.auth())
router.get('/profile/all-memberships', [UserController, 'allMemberships']).use(middleware.auth())
router.get('/users/:id', [UserController, 'show'])

// Cafe Wallet Routes (Protected - for members)
router.get('/cafe-wallets', [CafeWalletController, 'index']).use(middleware.auth())
router.get('/cafe-wallets/:warnetId', [CafeWalletController, 'show']).use(middleware.auth())
router.post('/cafe-wallets', [CafeWalletController, 'store']).use(middleware.auth())
router
  .patch('/cafe-wallets/:id/activate', [CafeWalletController, 'activate'])
  .use(middleware.auth())
router
  .patch('/cafe-wallets/:id/deactivate', [CafeWalletController, 'deactivate'])
  .use(middleware.auth())
router
  .patch('/cafe-wallets/:id/update-time', [CafeWalletController, 'updateTime'])
  .use(middleware.auth())

// Bowar Transaction Routes (Protected)
router.get('/bowar-transactions', [BowarTransactionController, 'index']).use(middleware.auth())
router.get('/bowar-transactions/:id', [BowarTransactionController, 'show']).use(middleware.auth())
router
  .post('/bowar-transactions/topup', [BowarTransactionController, 'topup'])
  .use(middleware.auth())
router
  .post('/bowar-transactions/payment', [BowarTransactionController, 'payment'])
  .use(middleware.auth())
router
  .post('/bowar-transactions/refund', [BowarTransactionController, 'refund'])
  .use(middleware.auth())
router
  .patch('/bowar-transactions/:id/approve', [BowarTransactionController, 'approve'])
  .use(middleware.auth())
router
  .patch('/bowar-transactions/:id/reject', [BowarTransactionController, 'reject'])
  .use(middleware.auth())

// Operator Routes (Protected - for operators only)
router
  .get('/operator/warnet/:warnetId/members', [OperatorController, 'getMembers'])
  .use(middleware.auth())
router
  .get('/operator/warnet/:warnetId/statistics', [OperatorController, 'getStatistics'])
  .use(middleware.auth())

// Booking Routes (Protected)
router.post('/bookings', [BookingController, 'create']).use(middleware.auth())
router.get('/bookings', [BookingController, 'index']).use(middleware.auth())
router.post('/bookings/:id/cancel', [BookingController, 'cancel']).use(middleware.auth())

// Operator Booking Management Routes (Protected - operators only)
router.get('/operator/bookings', [OperatorBookingsController, 'index']).use(middleware.auth())
router.get('/operator/bookings/pending', [OperatorBookingsController, 'pending']).use(middleware.auth())
router.post('/operator/bookings/:id/approve', [OperatorBookingsController, 'approve']).use(middleware.auth())
router.post('/operator/bookings/:id/reject', [OperatorBookingsController, 'reject']).use(middleware.auth())

// Chat Routes
router.get('/chat/:warnetId', [ChatController, 'index']).use(middleware.auth())
router.post('/chat', [ChatController, 'store']).use(middleware.auth())
router.patch('/chat/read/:id', [ChatController, 'markRead']).use(middleware.auth())

// Operator Chat Routes
router.get('/operator/conversations', [ChatController, 'getConversations']).use(middleware.auth())
router.get('/operator/chat/:userId', [ChatController, 'index']).use(middleware.auth())
