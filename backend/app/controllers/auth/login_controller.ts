import User from '#models/user'
import { loginValidator } from '#validators/loginValidator'
import { HttpContext } from '@adonisjs/core/http'

export default class LoginController {
  /**
   * Handle user login
   * Supports login with username or email
   * Returns user data with warnet info for members
   */
  public async login({ request, response, auth }: HttpContext) {
    const data = await request.validateUsing(loginValidator)

    try {
      // at least one must be provided
      if (!data.email && !data.username) {
        return response.badRequest({
          message: 'Email atau username harus diisi salah satu',
        })
      }

      // determine uid type
      const identifier = data.email || data.username
      const uidField = data.email ? 'email' : 'username'

      // find user manually
      const user = await User.findBy(uidField, identifier!)
      if (!user) {
        return response.unauthorized({
          message: 'Username/email atau password salah',
        })
      }

      // verify password
      const isValid = await User.verifyCredentials(identifier!, data.password)
      if (!isValid) {
        return response.unauthorized({
          message: 'Username/email atau password salah',
        })
      }

      // generate token
      const token = await auth.use('api').createToken(user)

      return response.ok({
        message: 'Login berhasil',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
        token,
      })
    } catch (error) {
      return response.unauthorized({
        message: 'Username/email atau password salah',
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

        const getUser = auth.user?.id
        const user = await User.findOrFail(getUser)
        await User.accessTokens.delete(user, user.id)

        return response.ok({
            success: true,
            message: 'User logged out',
            data: getUser
        })
    }
}
