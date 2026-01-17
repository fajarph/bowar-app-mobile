import { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import Warnet from '#models/warnet'
import Booking from '#models/booking'
import CafeWallet from '#models/cafe_wallet'
import BowarTransaction from '#models/bowar_transaction'
import { DateTime } from 'luxon'

export default class OperatorController {
  /**
   * GET /operator/warnet/:warnetId/members - Get all members for a warnet
   * Only accessible by operators of that warnet
   */
  async getMembers({ auth, params, response }: HttpContext) {
    try {
      await auth.check()
      const operator = auth.user!

      // Only operators can access this
      if (operator.role !== 'operator') {
        return response.forbidden({
          message: 'Hanya operator yang dapat mengakses data member',
        })
      }

      // Verify operator belongs to this warnet
      const warnetId = parseInt(params.warnetId)
      if (operator.warnet_id !== warnetId) {
        return response.forbidden({
          message: 'Anda tidak memiliki akses ke warnet ini',
        })
      }

      // Get all members of this warnet
      const members = await User.query()
        .where('warnet_id', warnetId)
        .where('role', 'member')
        .preload('cafeWallets', (query) => {
          query.where('warnet_id', warnetId)
        })

      // Get cafe wallets for each member
      const membersWithWallets = await Promise.all(
        members.map(async (member) => {
          const wallet = await CafeWallet.query()
            .where('user_id', member.id)
            .where('warnet_id', warnetId)
            .first()

          return {
            id: member.id.toString(),
            username: member.username,
            email: member.email,
            role: member.role,
            avatar: member.avatar,
            bowarWallet: member.bowar_wallet || 0,
            cafeWallets: wallet
              ? [
                {
                  cafeId: wallet.warnet_id.toString(),
                  cafeName: (await Warnet.find(wallet.warnet_id))?.name || '',
                  remainingMinutes: wallet.remaining_minutes,
                  isActive: wallet.is_active,
                  lastUpdated: wallet.last_updated.toMillis(),
                },
              ]
              : [],
            createdAt: member.createdAt.toISO(),
          }
        })
      )

      return response.ok({
        message: 'Daftar member berhasil diambil',
        data: membersWithWallets,
      })
    } catch (error: any) {
      console.error('Get members error:', error)
      return response.internalServerError({
        message: 'Terjadi kesalahan saat mengambil daftar member',
      })
    }
  }

  /**
   * GET /operator/warnet/:warnetId/statistics - Get statistics for operator's warnet
   * Returns revenue, bookings, members count, etc.
   */
  async getStatistics({ auth, params, request, response }: HttpContext) {
    try {
      await auth.check()
      const operator = auth.user!

      // Only operators can access this
      if (operator.role !== 'operator') {
        return response.forbidden({
          message: 'Hanya operator yang dapat mengakses statistik',
        })
      }

      const warnetId = parseInt(params.warnetId)
      if (operator.warnet_id !== warnetId) {
        return response.forbidden({
          message: 'Anda tidak memiliki akses ke warnet ini',
        })
      }

      // Get date range (default: today)
      const startDate = request.input('startDate')
        ? DateTime.fromISO(request.input('startDate'))
        : DateTime.now().startOf('day')
      const endDate = request.input('endDate')
        ? DateTime.fromISO(request.input('endDate')).endOf('day')
        : DateTime.now().endOf('day')

      // Get all bookings for this warnet in date range
      const bookings = await Booking.query()
        .where('warnet_id', warnetId)
        .whereBetween('created_at', [startDate.toSQL()!, endDate.toSQL()!])
        .preload('user')

      // Calculate revenue from completed bookings
      const completedBookings = bookings.filter((b) => b.payment_status === 'paid')
      const todayRevenue = completedBookings.reduce((sum, booking) => {
        return sum + parseFloat(booking.total_price.toString())
      }, 0)

      // Get today's bookings count
      const today = DateTime.now().startOf('day')
      const todayBookings = bookings.filter((b) => {
        const bookingDate = DateTime.fromJSDate(b.createdAt.toJSDate()).startOf('day')
        return bookingDate.equals(today)
      })

      // Get active bookings
      const activeBookings = bookings.filter((b) => b.status === 'active')

      // Get total members count
      const totalMembers = await User.query()
        .where('warnet_id', warnetId)
        .where('role', 'member')
        .count('* as total')
      const membersCount = parseInt(totalMembers[0].$extras.total.toString())

      // Get pending topups count for this warnet
      const pendingTopups = await BowarTransaction.query()
        .where('warnet_id', warnetId)
        .where('type', 'topup')
        .where('status', 'pending')
        .count('* as total')
      const pendingTopupsCount = parseInt(pendingTopups[0].$extras.total.toString())

      // Get pending booking payments count
      const pendingBookings = await Booking.query()
        .where('warnet_id', warnetId)
        .where('payment_status', 'pending')
        .whereNot('status', 'cancelled')
        .count('* as total')
      const pendingBookingsCount = parseInt(pendingBookings[0].$extras.total.toString())

      // Get all transactions for this warnet (bookings payments)
      const bookingTransactions = await Booking.query()
        .where('warnet_id', warnetId)
        .whereBetween('created_at', [startDate.toSQL()!, endDate.toSQL()!])
        .where('payment_status', 'paid')
        .orderBy('created_at', 'desc')
        .preload('user')
        .limit(50)



      // Get top-up transactions specifically for this warnet
      const topupTransactions = await BowarTransaction.query()
        .where('warnet_id', warnetId)
        .where('type', 'topup')
        .whereBetween('created_at', [startDate.toSQL()!, endDate.toSQL()!])
        .orderBy('created_at', 'desc')
        .preload('user')
        .limit(50)

      // Combine and sort all transactions
      const allTransactions = [
        ...bookingTransactions.map((t) => ({
          id: `booking_${t.id}`,
          type: 'payment',
          amount: parseFloat(t.total_price.toString()),
          description: `Pembayaran booking PC ${t.pc_number}`,
          status: t.payment_status,
          userId: t.user_id,
          username: t.user.username,
          email: t.user.email,
          createdAt: t.createdAt.toISO(),
          bookingId: t.id,
        })),
        ...topupTransactions.map((t) => {
          // Ensure user is loaded
          const user = t.user || null
          return {
            id: `topup_${t.id}`,
            type: 'topup',
            amount: parseFloat(t.amount.toString()),
            description: t.description || 'Top Up DompetBowar',
            status: t.status,
            userId: t.user_id,
            username: user?.username || 'Unknown',
            email: user?.email || 'Unknown',
            createdAt: t.createdAt.toISO(),
            proofImage: t.proof_image,
            senderName: t.sender_name,
          }
        }),
      ].sort((a, b) => {
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0
        return timeB - timeA
      })


      return response.ok({
        message: 'Statistik berhasil diambil',
        data: {
          todayRevenue,
          todayBookings: todayBookings.length,
          activeBookings: activeBookings.length,
          totalMembers: membersCount,
          pendingTopups: pendingTopupsCount,
          pendingBookings: pendingBookingsCount,
          transactions: allTransactions.slice(0, 50), // Limit to 50 most recent
        },
      })
    } catch (error: any) {
      console.error('Get statistics error:', error)
      return response.internalServerError({
        message: 'Terjadi kesalahan saat mengambil statistik',
      })
    }
  }
}
