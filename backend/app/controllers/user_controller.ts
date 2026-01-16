import { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import CafeWallet from '#models/cafe_wallet'

export default class UserController {
  /**
   * GET /profile - Get authenticated user profile
   * Returns user data with cafe wallets (if member)
   */
  async profile({ auth, response }: HttpContext) {
    try {
      // Check authentication
      await auth.check()
      const user = auth.user!

      if (!user) {
        return response.unauthorized({
          message: 'Silakan login terlebih dahulu',
        })
      }

      // Load warnet if exists
      if (user.warnet_id) {
        await user.load('warnet')
      }

      // Load cafe wallets for all users (not just members)
      let cafeWallets: Array<{
        cafeId: string
        cafeName: string
        balance: number
        remainingMinutes: number
        isActive: boolean
        lastUpdated: string
      }> = []

      const wallets = await CafeWallet.query()
        .where('user_id', user.id)
        .preload('warnet')

      cafeWallets = wallets.map((wallet) => ({
        cafeId: wallet.warnet_id.toString(),
        cafeName: wallet.warnet?.name || 'Unknown',
        balance: Number(wallet.balance) || 0,
        remainingMinutes: wallet.remaining_minutes || 0,
        isActive: wallet.is_active,
        lastUpdated: wallet.last_updated?.toISO() || new Date().toISOString(),
      }))

      // If user has a warnet_id but no wallet entry yet, ensure they have a balance entry
      if (user.warnet_id && !cafeWallets.find(w => w.cafeId === user.warnet_id?.toString()) && user.warnet) {
        cafeWallets.push({
          cafeId: user.warnet_id.toString(),
          cafeName: user.warnet.name,
          balance: 0,
          remainingMinutes: 0,
          isActive: false,
          lastUpdated: new Date().toISOString(),
        })
      }

      return response.ok({
        message: 'Profile berhasil diambil',
        data: {
          id: user.id.toString(),
          username: user.username,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          bowarWallet: user.bowar_wallet || 0,
          warnet: user.warnet
            ? {
              id: user.warnet.id,
              name: user.warnet.name,
              address: user.warnet.address,
            }
            : null,
          cafeWallets: cafeWallets,
        },
      })
    } catch {
      return response.unauthorized({
        message: 'Silakan login terlebih dahulu',
      })
    }
  }

  /**
   * PATCH /profile - Update user profile
   * Allows updating username, email, avatar
   */
  async update({ auth, request, response }: HttpContext) {
    try {
      // Check authentication
      await auth.check()
      const user = auth.user!

      if (!user) {
        return response.unauthorized({
          message: 'Silakan login terlebih dahulu',
        })
      }

      const { username, email, avatar } = request.only(['username', 'email', 'avatar'])

      // Check username uniqueness if changed
      if (username && username !== user.username) {
        const existingUser = await User.findBy('username', username)
        if (existingUser) {
          return response.badRequest({
            message: 'Username sudah digunakan',
          })
        }
        user.username = username
      }

      // Check email uniqueness if changed
      if (email && email !== user.email) {
        const existingUser = await User.findBy('email', email)
        if (existingUser) {
          return response.badRequest({
            message: 'Email sudah digunakan',
          })
        }
        user.email = email
      }

      // Update avatar if provided
      if (avatar !== undefined) {
        user.avatar = avatar
      }

      await user.save()

      return response.ok({
        message: 'Profile berhasil diperbarui',
        data: {
          id: user.id.toString(),
          username: user.username,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          bowarWallet: user.bowar_wallet || 0,
          cafeWallets: await CafeWallet.query().where('user_id', user.id),
        },
      })
    } catch (error: any) {
      console.error('Update profile error:', error)
      return response.internalServerError({
        message: 'Terjadi kesalahan saat memperbarui profile',
      })
    }
  }

  /**
   * GET /users/:id - Get user by ID (public info only)
   * Returns public user information
   */
  async show({ params, response }: HttpContext) {
    try {
      const user = await User.find(params.id)
      if (!user) {
        return response.notFound({
          message: 'User tidak ditemukan',
        })
      }

      return response.ok({
        message: 'User berhasil diambil',
        data: {
          id: user.id.toString(),
          username: user.username,
          avatar: user.avatar,
          // Don't expose email, role, etc for privacy
        },
      })
    } catch (error: any) {
      console.error('Show user error:', error)
      return response.internalServerError({
        message: 'Terjadi kesalahan saat mengambil data user',
      })
    }
  }

  /**
   * GET /profile/wallets - Get all cafe wallets for authenticated user
   * Alias for /cafe-wallets endpoint
   */
  async wallets({ auth, response }: HttpContext) {
    try {
      await auth.check()
      const user = auth.user!

      const wallets = await CafeWallet.query()
        .where('user_id', user.id)
        .preload('warnet')

      return response.ok({
        message: 'Daftar wallet berhasil diambil',
        data: wallets.map((wallet) => ({
          id: wallet.id,
          cafeId: wallet.warnet_id.toString(),
          cafeName: wallet.warnet?.name || 'Unknown',
          balance: Number(wallet.balance) || 0,
          remainingMinutes: wallet.remaining_minutes,
          isActive: wallet.is_active,
          lastUpdated: wallet.last_updated?.toISO(),
        })),
      })
    } catch {
      return response.unauthorized({
        message: 'Silakan login terlebih dahulu',
      })
    }
  }

  /**
   * GET /profile/all-memberships - Get all memberships for authenticated user's email
   * Returns all memberships from all accounts with the same email
   */
  async allMemberships({ auth, response }: HttpContext) {
    try {
      await auth.check()
      const user = auth.user!

      if (!user.email) {
        return response.ok({
          message: 'Email tidak ditemukan',
          data: [],
        })
      }

      // Find all users with the same email and role = 'member'
      const allMemberAccounts = await User.query()
        .where('email', user.email)
        .where('role', 'member')
        .preload('warnet')

      // Get all cafe wallets for all these member accounts
      const allMemberships: Array<{
        userId: string
        username: string
        cafeId: string
        cafeName: string
        remainingMinutes: number
        isActive: boolean
        lastUpdated: string
        isCurrentAccount: boolean
      }> = []

      for (const memberAccount of allMemberAccounts) {
        // Get wallets for this member account
        const wallets = await CafeWallet.query()
          .where('user_id', memberAccount.id)
          .where('warnet_id', memberAccount.warnet_id!)
          .preload('warnet')

        // If member has warnet_id but no wallet yet, create a placeholder
        if (memberAccount.warnet_id && wallets.length === 0 && memberAccount.warnet) {
          allMemberships.push({
            userId: memberAccount.id.toString(),
            username: memberAccount.username,
            cafeId: memberAccount.warnet_id.toString(),
            cafeName: memberAccount.warnet.name,
            remainingMinutes: 0,
            isActive: false,
            lastUpdated: new Date().toISOString(),
            isCurrentAccount: memberAccount.id === user.id,
          })
        } else {
          // Add all wallets for this member account
          wallets.forEach((wallet) => {
            allMemberships.push({
              userId: memberAccount.id.toString(),
              username: memberAccount.username,
              cafeId: wallet.warnet_id.toString(),
              cafeName: wallet.warnet.name,
              remainingMinutes: wallet.remaining_minutes,
              isActive: wallet.is_active,
              lastUpdated: wallet.last_updated.toISO() || new Date().toISOString(),
              isCurrentAccount: memberAccount.id === user.id,
            })
          })
        }
      }

      return response.ok({
        message: 'Semua membership berhasil diambil',
        data: allMemberships,
      })
    } catch (error: any) {
      console.error('Get all memberships error:', error)
      return response.internalServerError({
        message: 'Terjadi kesalahan saat mengambil data membership',
      })
    }
  }
}

