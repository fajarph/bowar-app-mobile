import { HttpContext } from '@adonisjs/core/http'
import CafeWallet from '#models/cafe_wallet'
import Warnet from '#models/warnet'

export default class CafeWalletController {
  /**
   * GET /cafe-wallets - Get all wallets for authenticated user
   * Returns all cafe wallets (memberships) for the logged-in user
   */
  async index({ auth, response }: HttpContext) {
    try {
      await auth.check()
      const user = auth.user!

      // Load all cafe wallets for this user
      const wallets = await CafeWallet.query()
        .where('user_id', user.id)
        .preload('warnet')

      return response.ok({
        message: 'Daftar wallet berhasil diambil',
        data: wallets.map((wallet) => ({
          id: wallet.id,
          cafeId: wallet.warnet_id.toString(),
          cafeName: wallet.warnet.name,
          remainingMinutes: wallet.remaining_minutes,
          isActive: wallet.is_active,
          lastUpdated: wallet.last_updated.toISO(),
        })),
      })
    } catch {
      return response.unauthorized({
        message: 'Silakan login terlebih dahulu',
      })
    }
  }

  /**
   * GET /cafe-wallets/:warnetId - Get wallet for specific warnet
   * Returns wallet for logged-in user at specific warnet
   */
  async show({ auth, params, response }: HttpContext) {
    try {
      await auth.check()
      const user = auth.user!

      const warnetId = parseInt(params.warnetId)
      if (isNaN(warnetId)) {
        return response.badRequest({
          message: 'ID warnet tidak valid',
        })
      }

      const wallet = await CafeWallet.query()
        .where('user_id', user.id)
        .where('warnet_id', warnetId)
        .preload('warnet')
        .first()

      if (!wallet) {
        return response.notFound({
          message: 'Wallet tidak ditemukan untuk warnet ini',
        })
      }

      return response.ok({
        message: 'Wallet berhasil diambil',
        data: {
          id: wallet.id,
          cafeId: wallet.warnet_id.toString(),
          cafeName: wallet.warnet.name,
          remainingMinutes: wallet.remaining_minutes,
          isActive: wallet.is_active,
          lastUpdated: wallet.last_updated.toISO(),
        },
      })
    } catch {
      return response.unauthorized({
        message: 'Silakan login terlebih dahulu',
      })
    }
  }

  /**
   * POST /cafe-wallets - Create or update wallet
   * Adds time to wallet (for member after payment)
   */
  async store({ auth, request, response }: HttpContext) {
    try {
      await auth.check()
      const user = auth.user!

      // Only members can have cafe wallets
      if (user.role !== 'member') {
        return response.forbidden({
          message: 'Hanya member yang dapat memiliki wallet',
        })
      }

      const { warnetId, minutes } = request.only(['warnetId', 'minutes'])

      if (!warnetId || !minutes) {
        return response.badRequest({
          message: 'warnetId dan minutes wajib diisi',
        })
      }

      const warnet = await Warnet.find(warnetId)
      if (!warnet) {
        return response.notFound({
          message: 'Warnet tidak ditemukan',
        })
      }

      // Check if wallet already exists
      let wallet = await CafeWallet.query()
        .where('user_id', user.id)
        .where('warnet_id', warnetId)
        .first()

      if (wallet) {
        // Update existing wallet - add minutes
        wallet.remaining_minutes += minutes
        wallet.last_updated = new Date() as any
        await wallet.save()
      } else {
        // Create new wallet
        wallet = await CafeWallet.create({
          user_id: user.id,
          warnet_id: warnetId,
          remaining_minutes: minutes,
          is_active: false,
          last_updated: new Date() as any,
        })
      }

      await wallet.load('warnet')

      return response.ok({
        message: 'Wallet berhasil diperbarui',
        data: {
          id: wallet.id,
          cafeId: wallet.warnet_id.toString(),
          cafeName: wallet.warnet.name,
          remainingMinutes: wallet.remaining_minutes,
          isActive: wallet.is_active,
          lastUpdated: wallet.last_updated.toISO(),
        },
      })
    } catch (error: any) {
      console.error('CafeWallet store error:', error)
      return response.internalServerError({
        message: 'Terjadi kesalahan saat memperbarui wallet',
      })
    }
  }

  /**
   * PATCH /cafe-wallets/:id/activate - Activate wallet (when user logs in at cafe)
   */
  async activate({ auth, params, response }: HttpContext) {
    try {
      await auth.check()
      const user = auth.user!

      const wallet = await CafeWallet.find(params.id)
      if (!wallet) {
        return response.notFound({
          message: 'Wallet tidak ditemukan',
        })
      }

      // Verify wallet belongs to user
      if (wallet.user_id !== user.id) {
        return response.forbidden({
          message: 'Anda tidak memiliki akses ke wallet ini',
        })
      }

      wallet.is_active = true
      wallet.last_updated = new Date() as any
      await wallet.save()

      await wallet.load('warnet')

      return response.ok({
        message: 'Wallet berhasil diaktifkan',
        data: {
          id: wallet.id,
          cafeId: wallet.warnet_id.toString(),
          cafeName: wallet.warnet.name,
          remainingMinutes: wallet.remaining_minutes,
          isActive: wallet.is_active,
          lastUpdated: wallet.last_updated.toISO(),
        },
      })
    } catch {
      return response.unauthorized({
        message: 'Silakan login terlebih dahulu',
      })
    }
  }

  /**
   * PATCH /cafe-wallets/:id/deactivate - Deactivate wallet (when user logs out)
   */
  async deactivate({ auth, params, response }: HttpContext) {
    try {
      await auth.check()
      const user = auth.user!

      const wallet = await CafeWallet.find(params.id)
      if (!wallet) {
        return response.notFound({
          message: 'Wallet tidak ditemukan',
        })
      }

      // Verify wallet belongs to user
      if (wallet.user_id !== user.id) {
        return response.forbidden({
          message: 'Anda tidak memiliki akses ke wallet ini',
        })
      }

      wallet.is_active = false
      wallet.last_updated = new Date() as any
      await wallet.save()

      await wallet.load('warnet')

      return response.ok({
        message: 'Wallet berhasil dinonaktifkan',
        data: {
          id: wallet.id,
          cafeId: wallet.warnet_id.toString(),
          cafeName: wallet.warnet.name,
          remainingMinutes: wallet.remaining_minutes,
          isActive: wallet.is_active,
          lastUpdated: wallet.last_updated.toISO(),
        },
      })
    } catch {
      return response.unauthorized({
        message: 'Silakan login terlebih dahulu',
      })
    }
  }

  /**
   * PATCH /cafe-wallets/:id/update-time - Update remaining time
   * Used for real-time countdown
   */
  async updateTime({ auth, params, request, response }: HttpContext) {
    try {
      await auth.check()
      const user = auth.user!

      const { remainingMinutes } = request.only(['remainingMinutes'])

      if (remainingMinutes === undefined) {
        return response.badRequest({
          message: 'remainingMinutes wajib diisi',
        })
      }

      const wallet = await CafeWallet.find(params.id)
      if (!wallet) {
        return response.notFound({
          message: 'Wallet tidak ditemukan',
        })
      }

      // Verify wallet belongs to user
      if (wallet.user_id !== user.id) {
        return response.forbidden({
          message: 'Anda tidak memiliki akses ke wallet ini',
        })
      }

      wallet.remaining_minutes = Math.max(0, remainingMinutes)
      wallet.last_updated = new Date() as any
      await wallet.save()

      await wallet.load('warnet')

      return response.ok({
        message: 'Waktu wallet berhasil diperbarui',
        data: {
          id: wallet.id,
          cafeId: wallet.warnet_id.toString(),
          cafeName: wallet.warnet.name,
          remainingMinutes: wallet.remaining_minutes,
          isActive: wallet.is_active,
          lastUpdated: wallet.last_updated.toISO(),
        },
      })
    } catch {
      return response.unauthorized({
        message: 'Silakan login terlebih dahulu',
      })
    }
  }
}

