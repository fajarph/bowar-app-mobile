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

router.get('/', async () => {
  return {
    hello: 'JENONKKKKK',
  }
})

// Auth Routes
// Register
router.post('/register/user', [RegisterController, 'registerUser'])
router.post('/register/member', [RegisterController, 'registerMember'])

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
