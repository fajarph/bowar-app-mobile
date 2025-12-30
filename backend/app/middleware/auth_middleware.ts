import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import type { Authenticators } from '@adonisjs/auth/types'

/**
 * Auth middleware is used authenticate HTTP requests and deny
 * access to unauthenticated users.
 */
export default class AuthMiddleware {
  /**
   * The URL to redirect to, when authentication fails
   */
  redirectTo = '/login'

  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: {
      guards?: (keyof Authenticators)[]
    } = {}
  ) {
    try {
      // Use 'api' guard by default if no guard specified
      const guards = options.guards || ['api']
      
      // Debug: log auth attempt
      const authHeader = ctx.request.header('authorization')
      if (!authHeader) {
        console.warn('No Authorization header found in request')
        return ctx.response.unauthorized({
          message: 'Silakan login terlebih dahulu',
        })
      }
      
      await ctx.auth.authenticateUsing(guards, { loginRoute: this.redirectTo })
      return next()
    } catch (error: any) {
      console.error('Auth middleware error:', error.message)
      return ctx.response.unauthorized({
        message: 'Token tidak valid atau telah kedaluwarsa. Silakan login kembali.',
      })
    }
  }
}