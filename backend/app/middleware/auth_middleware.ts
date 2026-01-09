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
      // AdonisJS header() is case-insensitive, but let's try both to be sure
      const authHeader = ctx.request.header('authorization') || ctx.request.header('Authorization')
      
      if (!authHeader) {
        console.warn('❌ No Authorization header found in request:', ctx.request.url())
        console.warn('   Request method:', ctx.request.method())
        return ctx.response.unauthorized({
          message: 'Silakan login terlebih dahulu',
        })
      }
      
      // Extract token from Bearer header
      let token: string | null = null
      if (authHeader.startsWith('Bearer ') || authHeader.startsWith('bearer ')) {
        token = authHeader.substring(7).trim()
      } else {
        // If no Bearer prefix, assume the whole header is the token
        token = authHeader.trim()
      }
      
      if (!token || token.length === 0) {
        console.warn('❌ Empty token in Authorization header')
        return ctx.response.unauthorized({
          message: 'Token tidak valid',
        })
      }
      
      // Log token presence (but not the actual token for security)
      console.log('✅ Authorization header found, token length:', token.length)
      console.log('   Token preview:', token.substring(0, 20) + '...')
      
      try {
        await ctx.auth.authenticateUsing(guards, { loginRoute: this.redirectTo })
      } catch (authError: any) {
        console.error('❌ Authentication failed:', authError.message)
        console.error('   Auth error code:', authError.code)
        console.error('   Token used:', token.substring(0, 30) + '...')
        throw authError // Re-throw to be caught by outer catch
      }
      
      // Log successful authentication
      const user = ctx.auth.user
      if (user) {
        console.log('✅ User authenticated:', user.username, 'Role:', user.role, 'ID:', user.id)
      }
      
      return next()
    } catch (error: any) {
      console.error('❌ Auth middleware error:', error.message)
      console.error('Error details:', {
        name: error.name,
        code: error.code,
        status: error.status,
      })
      return ctx.response.unauthorized({
        message: 'Token tidak valid atau telah kedaluwarsa. Silakan login kembali.',
      })
    }
  }
}