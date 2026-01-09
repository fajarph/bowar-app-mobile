// import User from '#models/user'
// import { loginValidator } from '#validators/loginValidator'
// import { HttpContext } from '@adonisjs/core/http'
// import hash from '@adonisjs/core/services/hash'

// export default class LoginController {
//   /**
//    * Handle user login (unified endpoint)
//    * Supports login with username or email
//    * Returns user data with warnet info for members
//    * Can be used for both regular user and member login
//    */
//   public async login({ request, response, auth }: HttpContext) {
//     try {
//       const data = await request.validateUsing(loginValidator)
      
//       // Log request data (without password for security)
//       console.log('Login request received:', {
//         identifier: data.email || data.username,
//         role: request.input('role'),
//         warnet_id: request.input('warnet_id'),
//       })

//       // at least one must be provided
//       if (!data.email && !data.username) {
//         return response.badRequest({
//           message: 'Email atau username harus diisi salah satu',
//         })
//       }

//       // determine uid type
//       const identifier = data.email || data.username
//       const uidField = data.email ? 'email' : 'username'

//       // Try to find user first to validate role and warnet before password check
//       const user = await User.findBy(uidField, identifier!)
//       if (!user) {
//         console.log(`Login attempt failed: User not found with ${uidField} = ${identifier}`)
//         return response.unauthorized({
//           message: 'Username/email atau password salah',
//         })
//       }

//       // Validate user role matches requested login type BEFORE password check
//       const requestedRole = request.input('role')
//       if (requestedRole) {
//         // If requesting member login but user is not member
//         if (requestedRole === 'member' && user.role !== 'member') {
//           console.log(`Login attempt failed: User ${user.username} is ${user.role}, but requested member`)
//           return response.forbidden({
//             message: 'Akun ini bukan member. Silakan login sebagai user biasa.',
//           })
//         }
//         // If requesting regular user login but user is member/operator (they should use member login)
//         if (requestedRole === 'user' && (user.role === 'member' || user.role === 'operator')) {
//           console.log(`Login attempt failed: User ${user.username} is ${user.role}, but requested user`)
//           return response.forbidden({
//             message: `Akun ini adalah ${user.role === 'member' ? 'member' : 'operator'}. Silakan login sebagai ${user.role === 'member' ? 'member' : 'operator'}.`,
//           })
//         }
//       }

//       // Validate warnet for member login BEFORE password check
//       const requestedWarnetId = request.input('warnet_id')
//       const requestedRole = request.input('role')
      
//       console.log(`Warnet validation check: user.role=${user.role}, requestedRole=${requestedRole}, requestedWarnetId=${requestedWarnetId}, user.warnet_id=${user.warnet_id}`)
      
//       // If user is member OR if requesting member login, validate warnet_id
//       if (user.role === 'member' || requestedRole === 'member') {
//         // For member login, warnet_id must be provided and must match user's warnet_id
//         if (requestedWarnetId === undefined || requestedWarnetId === null || requestedWarnetId === '') {
//           console.log(`Login attempt failed: Member login requires warnet_id but none provided. User role: ${user.role}, Requested role: ${requestedRole}`)
//           return response.badRequest({
//             message: 'Member login memerlukan pemilihan warnet.',
//           })
//         }
        
//         const requestedId = Number(requestedWarnetId)
//         const userWarnetId = user.warnet_id ? Number(user.warnet_id) : null
        
//         console.log(`Validating warnet: User warnet_id=${userWarnetId}, Requested warnet_id=${requestedId}, Types: userWarnetId=${typeof userWarnetId}, requestedId=${typeof requestedId}`)
        
//         if (userWarnetId === null) {
//           console.log(`Login attempt failed: User ${user.username} has no warnet_id`)
//           return response.forbidden({
//             message: 'Akun member ini tidak terdaftar di warnet manapun.',
//           })
//         }
        
//         if (userWarnetId !== requestedId) {
//           console.log(`Login attempt failed: User ${user.username} is member of warnet ${userWarnetId}, but requested warnet ${requestedId}`)
//           return response.forbidden({
//             message: `Anda bukan member di warnet yang dipilih. Anda terdaftar di warnet ID ${userWarnetId}.`,
//           })
//         }
        
//         console.log(`Warnet validation passed: User ${user.username} is member of warnet ${requestedId}`)
//       }

//       // Verify password using hash service
//       // Note: In AdonisJS v6, hash.verify(hashedPassword, plainPassword) is correct
//       console.log(`Verifying password for user: ${user.username}`)
//       console.log(`Password hash length: ${user.password?.length || 0}`)
      
//       // Ensure password is hashed (should start with $scrypt$)
//       if (!user.password || !user.password.startsWith('$scrypt$')) {
//         console.log(`Warning: Password for user ${user.username} does not appear to be hashed properly`)
//       }
      
//       const isValidPassword = await hash.verify(user.password, data.password)
//       if (!isValidPassword) {
//         console.log(`Login attempt failed: Invalid password for user ${user.username}`)
//         console.log(`Password verification failed. This could mean:`)
//         console.log(`1. Password in database is not properly hashed`)
//         console.log(`2. Password provided does not match`)
//         console.log(`3. Hash algorithm mismatch`)
//         return response.unauthorized({
//           message: 'Username/email atau password salah',
//         })
//       }

//       // Log successful password verification (remove in production)
//       console.log(`User ${user.username} (${user.role}) authenticated successfully`)

//       // Load warnet relation if exists (for members and operators)
//       if (user.warnet_id) {
//         await user.load('warnet')
//       }

//       // generate token
//       const token = await auth.use('api').createToken(user)

//       // Prepare user response
//       const userResponse: any = {
//         id: user.id.toString(),
//         username: user.username,
//         email: user.email,
//         role: user.role,
//       }

//       // Add warnet info for members and operators
//       if (user.warnet) {
//         userResponse.warnet = {
//           id: user.warnet.id,
//           name: user.warnet.name,
//           address: user.warnet.address,
//         }
//       }

//       return response.ok({
//         message: 'Login berhasil',
//         user: userResponse,
//         token: token,
//       })
//     } catch (error: any) {
//       // Re-throw validation errors to let AdonisJS handle them
//       if (error.code === 'E_VALIDATION_FAILURE') {
//         throw error
//       }
//       // Handle other errors
//       console.error('Login error:', error)
//       return response.internalServerError({
//         message: 'Terjadi kesalahan saat login',
//       })
//     }
//   }


//   /**
//    * Login for regular user
//    * Wrapper for consistency with register endpoints
//    */
//   public async loginUser({ request, response, auth }: HttpContext) {
//     // Ensure role='user' is set in request body
//     const body = request.body()
//     if (!body.role) {
//       body.role = 'user'
//     }
//     console.log('loginUser called with body:', { username: body.username, role: body.role })
//     // Call main login method
//     return this.login({ request, response, auth } as HttpContext)
//   }

//   /**
//    * Login for member
//    * Wrapper for consistency with register endpoints
//    * Requires warnet_id
//    */
//   public async loginMember({ request, response, auth }: HttpContext) {
//     // Ensure role='member' is set in request body
//     const body = request.body()
//     if (!body.role) {
//       body.role = 'member'
//     }
//     console.log('loginMember called with body:', { username: body.username, role: body.role, warnet_id: body.warnet_id })
//     // Call main login method
//     return this.login({ request, response, auth } as HttpContext)
//   }

//   /**
//    * Get authenticated user profile
//    */
//   public async profile({ auth, response }: HttpContext) {
//     try {
//       await auth.check()
//       const user = auth.user!

//       // Load warnet relation if exists
//       if (user.warnet_id) {
//         await user.load('warnet')
//       }

//       // Load user bookings count
//       await user.load('bookings', (query) => {
//         query.where('status', 'active')
//       })

//       const userResponse: any = {
//         id: user.id.toString(),
//         username: user.username,
//         email: user.email,
//         role: user.role,
//       }

//       if (user.warnet) {
//         userResponse.warnet = {
//           id: user.warnet.id,
//           name: user.warnet.name,
//           address: user.warnet.address,
//         }
//       }

//       return response.ok({
//         message: 'Profile berhasil diambil',
//         data: userResponse,
//       })
//     } catch {
//       return response.unauthorized({
//         message: 'Silakan login terlebih dahulu',
//       })
//     }
//   }

//   /**
//    * Logout user (revoke token)
//    */
//   public async logout({ auth, response }: HttpContext) {
//     try {
//       await auth.check()
      
//       // Revoke current token
//       await auth.use('api').revoke()

//       return response.ok({
//         message: 'Logout berhasil',
//       })
//     } catch {
//       return response.unauthorized({
//         message: 'Silakan login terlebih dahulu',
//       })
//     }
//   }
// }


import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { loginValidator } from '#validators/loginValidator'

export default class AuthController {
  public async login({ request, response, auth }: HttpContext) {
    const { username, password } =
      await request.validateUsing(loginValidator)

    try {
      // 🔐 Auto detect email / username
      const user = await User.verifyCredentials(username, password)

      // Load warnet relation if exists (for members and operators)
      if (user.warnet_id) {
        await user.load('warnet')
      }

      // 🎫 Create access token
      const token = await auth.use('api').createToken(user)

      // Log token info for debugging (without exposing actual token)
      console.log('✅ Token created for user:', user.username, 'Token type:', typeof token, 'Has value:', !!token?.value)

      // Prepare user response
      const userResponse: any = {
        id: user.id.toString(),
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar || null,
        bowarWallet: user.bowar_wallet || 0,
      }

      // Add warnet info for members and operators
      if (user.warnet) {
        userResponse.warnet = {
          id: user.warnet.id,
          name: user.warnet.name,
          address: user.warnet.address,
        }
      }

      return response.ok({
        message: 'Login berhasil',
        user: userResponse,
        token, // AdonisJS token object with .value property
      })
    } catch (error: any) {
      console.error('Login error:', error)
      return response.unauthorized({
        message: 'Username/email atau password salah',
      })
    }
  }
}
