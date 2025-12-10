import User from '#models/user'
import { loginValidator } from '#validators/loginValidator'
import { HttpContext } from '@adonisjs/core/http'
import hash from '@adonisjs/core/services/hash'

export default class LoginController {
  /**
   * Handle user login
   * Supports login with username or email
   * Returns user data with warnet info for members
   */
  public async login({ request, response, auth }: HttpContext) {
    const data = await request.validateUsing(loginValidator)

    try {
      // Validate that at least username or email is provided
      if (!data.username && !data.email) {
        return response.badRequest({
          message: 'Username atau email harus diisi',
        })
      }

      // Find user by username or email
      let user: User | null = null

      if (data.username) {
        user = await User.findBy('username', data.username)
      } else if (data.email) {
        user = await User.findBy('email', data.email)
      }

      if (!user) {
        return response.unauthorized({
          message: 'Username atau email tidak ditemukan',
        })
      }

      // Verify password using hash service
      const isValidPassword = await hash.verify(user.password, data.password)
      if (!isValidPassword) {
        return response.unauthorized({
          message: 'Password salah',
        })
      }

      // Verify role if specified (optional validation)
      if (data.role && user.role !== data.role) {
        return response.unauthorized({
          message: `Anda tidak memiliki akses sebagai ${data.role}`,
        })
      }

      // Load warnet relation if user is member or operator
      if (user.warnet_id) {
        await user.load('warnet')
      }

      // Generate API Token
      const token = await auth.use('api').createToken(user)

      // Prepare user response
      const userResponse: any = {
        id: user.id.toString(),
        username: user.username,
        email: user.email,
        role: user.role,
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
        token: token,
      })
    } catch (error: any) {
      // Handle specific error cases
      if (error.messages) {
        return response.badRequest({
          message: 'Validasi gagal',
          errors: error.messages,
        })
      }

      return response.unauthorized({
        message: 'Username atau password salah',
      })
    }
  }

  /**
   * Get authenticated user profile
   */
  public async profile({ auth, response }: HttpContext) {
    try {
      await auth.check()
      const user = auth.user!

      // Load warnet relation if exists
      if (user.warnet_id) {
        await user.load('warnet')
      }

      // Load user bookings count
      await user.load('bookings', (query) => {
        query.where('status', 'active')
      })

      const userResponse: any = {
        id: user.id.toString(),
        username: user.username,
        email: user.email,
        role: user.role,
      }

      if (user.warnet) {
        userResponse.warnet = {
          id: user.warnet.id,
          name: user.warnet.name,
          address: user.warnet.address,
        }
      }

      return response.ok({
        message: 'Profile berhasil diambil',
        data: userResponse,
      })
    } catch {
      return response.unauthorized({
        message: 'Silakan login terlebih dahulu',
      })
    }
  }

  /**
   * Logout user (revoke token)
   */
  public async logout({ auth, response }: HttpContext) {
    try {
      await auth.check()
      
      // Revoke current token
      await auth.use('api').revoke()

      return response.ok({
        message: 'Logout berhasil',
      })
    } catch {
      return response.unauthorized({
        message: 'Silakan login terlebih dahulu',
      })
    }
  }
}
