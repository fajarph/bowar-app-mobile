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