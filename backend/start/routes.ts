/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'

const RegisterController = () => import('../app/controllers/auth/register_controller.js')
const LoginController = () => import('#controllers/auth/loginController')
const WarnetController = () => import('#controllers/warnetController')

router.get('/', async () => {
  return {
    hello: 'JENONKKKKK',
  }
})

// Auth Routes
router.post('/register/user', [RegisterController, 'registerUser'])
router.post('/register/member', [RegisterController, 'registerMember'])
router.post('/login', [LoginController, 'login'])
router
  .get('/profile', [LoginController, 'profile'])
  .use([() => import('#middleware/auth_middleware')])
router
  .post('/logout', [LoginController, 'logout'])
  .use([() => import('#middleware/auth_middleware')])

// Warnet Routes
router.get('/warnets', [WarnetController, 'index'])
router.get('/warnets/:id', [WarnetController, 'show'])
