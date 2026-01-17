import { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import BowarTransaction from '#models/bowar_transaction'
import User from '#models/user'
import Booking from '#models/booking'
import CafeWallet from '#models/cafe_wallet'

export default class BowarTransactionController {
  /**
   * GET /bowar-transactions - Get all transactions for authenticated user
   * Returns transaction history for DompetBowar
   * For operators: returns all pending topups if status=pending query param is provided
   */
  async index({ auth, request, response }: HttpContext) {
    try {
      /* ================= AUTH ================= */
      await auth.check()
      const user = auth.user!

      /* ================= QUERY PARAMS ================= */
      const page = request.input('page', 1)
      const limit = request.input('limit', 20)
      const status = request.input('status')
      const type = request.input('type')

      /* ================= BASE QUERY ================= */
      let query = BowarTransaction
        .query()
        .orderBy('created_at', 'desc')

      /* ================= ROLE LOGIC ================= */
      if (user.role === 'operator' && type === 'topup') {
        // Operators can only see transactions for their own warnet
        query.where('type', 'topup')
          .where('warnet_id', user.warnet_id!)
          .preload('user')
          .preload('warnet')

        if (status) {
          query.where('status', status)
        }
      } else {
        query.where('user_id', user.id)

        if (status) query.where('status', status)
        if (type) query.where('type', type)
      }

      /* ================= PAGINATION ================= */
      const transactions = await query.paginate(page, limit)

      /* ================= SERIALIZE ================= */
      const data = transactions.serialize().data.map((tx: any) => ({
        id: tx.id,
        type: tx.type,
        amount: Number(tx.amount),
        description: tx.description,
        status: tx.status,
        createdAt: tx.createdAt || tx.created_at,
        proofImage: (tx.proof_image || tx.proofImage)?.startsWith('http')
          ? (tx.proof_image || tx.proofImage)
          : ((tx.proof_image || tx.proofImage) ? `${request.protocol()}://${request.host()}${tx.proof_image || tx.proofImage}` : null),
        senderName: tx.sender_name || tx.senderName,
        warnetId: tx.warnet_id,
        warnetName: tx.warnet?.name,

        ...(user.role === 'operator' && type === 'topup' && {
          userId: tx.user?.id,
          username: tx.user?.username ?? 'Unknown',
          email: tx.user?.email ?? 'Unknown',
          userRole: tx.user?.role ?? 'Unknown',
        }),
      }))

      /* ================= RESPONSE ================= */
      return response.ok({
        message: 'Riwayat transaksi berhasil diambil',
        data,
        meta: transactions.serialize().meta,
      })

    } catch (error: any) {
      console.error('❌ BowarTransaction index error:', error)

      /* ================= AUTH ERROR ================= */
      if (error.code === 'E_UNAUTHORIZED_ACCESS') {
        return response.unauthorized({
          message: 'Silakan login terlebih dahulu',
        })
      }

      /* ================= SERVER ERROR ================= */
      return response.internalServerError({
        message: 'Terjadi kesalahan pada server',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      })
    }
  }


  /**
   * GET /bowar-transactions/:id - Get transaction detail
   */
  async show({ auth, params, request, response }: HttpContext) {
    try {
      await auth.check()
      const user = auth.user!

      const transaction = await BowarTransaction.query()
        .where('id', params.id)
        .preload('user')
        .preload('booking')
        .first()

      if (!transaction) {
        return response.notFound({
          message: 'Transaksi tidak ditemukan',
        })
      }

      // Verify transaction belongs to user OR user is operator and it's a topup
      const isOwner = transaction.user_id === user.id
      const isOperatorViewingTopup = user.role === 'operator' && transaction.type === 'topup'

      if (!isOwner && !isOperatorViewingTopup) {
        return response.forbidden({
          message: 'Anda tidak memiliki akses ke transaksi ini',
        })
      }

      return response.ok({
        message: 'Detail transaksi berhasil diambil',
        data: {
          id: transaction.id,
          type: transaction.type,
          amount: parseFloat(transaction.amount.toString()),
          description: transaction.description,
          status: transaction.status,
          proofImage: transaction.proof_image?.startsWith('http')
            ? transaction.proof_image
            : (transaction.proof_image ? `${request.protocol()}://${request.host()}${transaction.proof_image}` : null),
          senderName: transaction.sender_name,
          bookingId: transaction.booking_id,
          warnetId: transaction.warnet_id,
          warnetName: transaction.warnet?.name,
          createdAt: transaction.createdAt.toISO(),
          // Include user info for operators
          ...(user.role === 'operator' && {
            userId: transaction.user?.id,
            username: transaction.user?.username,
            email: transaction.user?.email,
          })
        },
      })
    } catch {
      return response.unauthorized({
        message: 'Silakan login terlebih dahulu',
      })
    }
  }

  /**
   * POST /bowar-transactions/topup - Create topup transaction
   * For topup via transfer (requires approval)
   */
  async topup({ auth, request, response }: HttpContext) {
    try {
      await auth.check()
      const user = auth.user!

      const { amount, description, senderName, warnetId } = request.only([
        'amount',
        'description',
        'senderName',
        'warnetId',
      ])

      const proofImageFile = request.file('proofImage', {
        size: '5mb',
        extnames: ['jpg', 'png', 'jpeg', 'webp'],
      })

      // If no file but has proofImage in body, it might be base64 (legacy)
      let finalProofImage = request.input('proofImage')

      if (proofImageFile) {
        if (!proofImageFile.isValid) {
          return response.badRequest({
            message: 'Bukti transfer tidak valid atau terlalu besar (maks 5MB)',
            errors: proofImageFile.errors,
          })
        }

        const fileName = `${new Date().getTime()}.${proofImageFile.extname}`
        await proofImageFile.move('public/uploads/topups', {
          name: fileName,
          overwrite: true,
        })
        finalProofImage = `/uploads/topups/${fileName}`
      }

      if (!amount || amount <= 0) {
        return response.badRequest({
          message: 'Jumlah top up harus lebih dari 0',
        })
      }

      if (!finalProofImage || !senderName || !warnetId) {
        return response.badRequest({
          message: 'Bukti transfer, nama pengirim, dan warnet wajib diisi',
        })
      }

      // Create pending transaction
      const transaction = await BowarTransaction.create({
        user_id: user.id,
        type: 'topup',
        amount: amount,
        description: description || `Top Up DompetBowar sebesar Rp ${Number(amount).toLocaleString()}`,
        status: 'pending',
        proof_image: finalProofImage,
        sender_name: senderName,
        warnet_id: warnetId,
      })

      return response.created({
        message: 'Permintaan top up berhasil dibuat. Menunggu konfirmasi.',
        data: {
          id: transaction.id,
          type: transaction.type,
          amount: parseFloat(transaction.amount.toString()),
          status: transaction.status,
          createdAt: transaction.createdAt.toISO(),
        },
      })
    } catch (error: any) {
      console.error('Topup error:', error)
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack,
      })
      return response.internalServerError({
        message: error.message || 'Terjadi kesalahan saat membuat permintaan top up',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      })
    }
  }

  /**
   * POST /bowar-transactions/payment - Create payment transaction
   * Deducts from DompetBowar for booking payment
   */
  async payment({ auth, request, response }: HttpContext) {
    try {
      await auth.check()
      const user = auth.user!

      const { bookingId, amount, description } = request.only([
        'bookingId',
        'amount',
        'description',
      ])

      if (!bookingId || !amount) {
        return response.badRequest({
          message: 'bookingId dan amount wajib diisi',
        })
      }

      // Verify booking exists and belongs to user
      const booking = await Booking.find(bookingId)
      if (!booking) {
        return response.notFound({
          message: 'Booking tidak ditemukan',
        })
      }

      if (booking.user_id !== user.id) {
        return response.forbidden({
          message: 'Anda tidak memiliki akses ke booking ini',
        })
      }

      // Check per-warnet balance
      const cafeWallet = await CafeWallet.query()
        .where('user_id', user.id)
        .where('warnet_id', booking.warnet_id)
        .first()

      if (!cafeWallet || cafeWallet.balance < amount) {
        return response.badRequest({
          message: 'Saldo Warnet ini tidak cukup. Silakan top up khusus di warnet ini.',
        })
      }

      // Deduct from cafe wallet balance
      cafeWallet.balance -= amount
      await cafeWallet.save()

      // Create payment transaction
      const transaction = await BowarTransaction.create({
        user_id: user.id,
        type: 'payment',
        amount: -amount, // Negative for payment
        description: description || `Pembayaran booking #${bookingId}`,
        booking_id: bookingId,
        warnet_id: booking.warnet_id,
        status: 'completed',
      })

      return response.created({
        message: 'Pembayaran berhasil',
        data: {
          id: transaction.id,
          type: transaction.type,
          amount: parseFloat(transaction.amount.toString()),
          description: transaction.description,
          status: transaction.status,
          newBalance: user.bowar_wallet,
          createdAt: transaction.createdAt.toISO(),
        },
      })
    } catch (error: any) {
      console.error('Payment error:', error)
      return response.internalServerError({
        message: 'Terjadi kesalahan saat memproses pembayaran',
      })
    }
  }

  /**
   * POST /bowar-transactions/refund - Create refund transaction
   * Adds balance back to DompetBowar (for cancelled bookings)
   */
  async refund({ auth, request, response }: HttpContext) {
    try {
      await auth.check()
      const user = auth.user!

      const { bookingId, amount, description } = request.only([
        'bookingId',
        'amount',
        'description',
      ])

      if (!amount || amount <= 0) {
        return response.badRequest({
          message: 'Jumlah refund harus lebih dari 0',
        })
      }

      const booking = bookingId ? await Booking.find(bookingId) : null

      // Add to cafe wallet balance
      let cafeWallet = await CafeWallet.query()
        .where('user_id', user.id)
        .where('warnet_id', booking?.warnet_id || 0)
        .first()

      if (!cafeWallet && booking) {
        cafeWallet = await CafeWallet.create({
          user_id: user.id,
          warnet_id: booking.warnet_id,
          remaining_minutes: 0,
          balance: 0,
          is_active: false,
          last_updated: DateTime.now(),
        })
      }

      if (cafeWallet) {
        cafeWallet.balance = (Number(cafeWallet.balance) || 0) + amount
        await cafeWallet.save()
      }

      // Create refund transaction
      const transaction = await BowarTransaction.create({
        user_id: user.id,
        type: 'refund',
        amount: amount,
        description: description || `Refund untuk booking #${bookingId || 'N/A'}`,
        booking_id: bookingId || null,
        warnet_id: booking?.warnet_id || null,
        status: 'completed',
      })

      return response.created({
        message: 'Refund berhasil diproses',
        data: {
          id: transaction.id,
          type: transaction.type,
          amount: parseFloat(transaction.amount.toString()),
          description: transaction.description,
          status: transaction.status,
          newBalance: user.bowar_wallet,
          createdAt: transaction.createdAt.toISO(),
        },
      })
    } catch (error: any) {
      console.error('Refund error:', error)
      return response.internalServerError({
        message: 'Terjadi kesalahan saat memproses refund',
      })
    }
  }

  /**
   * PATCH /bowar-transactions/:id/approve - Approve pending topup (for admin/operator)
   * Adds balance to user's DompetBowar
   */
  async approve({ auth, params, response }: HttpContext) {
    try {
      await auth.check()
      const user = auth.user!

      // Only operator/admin can approve
      if (user.role !== 'operator') {
        return response.forbidden({
          message: 'Hanya operator yang dapat menyetujui top up',
        })
      }

      const transaction = await BowarTransaction.find(params.id)
      if (!transaction) {
        return response.notFound({
          message: 'Transaksi tidak ditemukan',
        })
      }

      // Security check: Operator can only approve transactions for their own warnet
      if (user.warnet_id !== transaction.warnet_id) {
        return response.forbidden({
          message: 'Anda tidak memiliki akses untuk menyetujui transaksi warnet ini',
        })
      }

      if (transaction.status !== 'pending') {
        return response.badRequest({
          message: 'Transaksi ini sudah diproses',
        })
      }

      if (transaction.type !== 'topup') {
        return response.badRequest({
          message: 'Hanya transaksi topup yang dapat disetujui',
        })
      }

      // Get transaction owner
      const transactionOwner = await User.find(transaction.user_id)
      if (!transactionOwner) {
        return response.notFound({
          message: 'User pemilik transaksi tidak ditemukan',
        })
      }

      // Update CafeWallet balance instead of global wallet
      let cafeWallet = await CafeWallet.query()
        .where('user_id', transactionOwner.id)
        .where('warnet_id', transaction.warnet_id!)
        .first()

      if (!cafeWallet) {
        cafeWallet = await CafeWallet.create({
          user_id: transactionOwner.id,
          warnet_id: transaction.warnet_id!,
          remaining_minutes: 0,
          balance: 0,
          is_active: false,
          last_updated: DateTime.now(),
        })
      }

      // Calculate new balance
      const currentBalance = Number(cafeWallet.balance) || 0
      const topupAmount = Number(transaction.amount) || 0
      const newBalance = currentBalance + topupAmount

      cafeWallet.balance = newBalance
      await cafeWallet.save()

      // Update transaction status and save approval info
      transaction.status = 'completed'
      transaction.approved_by = user.id
      transaction.approved_at = DateTime.now()
      await transaction.save()

      console.log(`✅ Topup approved: User ${transactionOwner.id} CafeWallet (Warnet ${transaction.warnet_id}) balance updated from ${currentBalance} to ${newBalance}`)

      return response.ok({
        message: 'Top up berhasil disetujui',
        data: {
          id: transaction.id,
          type: transaction.type,
          amount: parseFloat(transaction.amount.toString()),
          status: transaction.status,
          newBalance: cafeWallet.balance,
          warnetId: transaction.warnet_id,
        },
      })
    } catch (error: any) {
      console.error('Approve error:', error)
      return response.internalServerError({
        message: 'Terjadi kesalahan saat menyetujui top up',
      })
    }
  }

  /**
   * PATCH /bowar-transactions/:id/reject - Reject pending topup (for admin/operator)
   */
  async reject({ auth, params, request, response }: HttpContext) {
    try {
      await auth.check()
      const user = auth.user!

      // Only operator can reject
      if (user.role !== 'operator') {
        return response.forbidden({
          message: 'Hanya operator yang dapat menolak top up',
        })
      }

      const transaction = await BowarTransaction.find(params.id)
      if (!transaction) {
        return response.notFound({
          message: 'Transaksi tidak ditemukan',
        })
      }

      // Security check: Operator can only reject transactions for their own warnet
      if (user.warnet_id !== transaction.warnet_id) {
        return response.forbidden({
          message: 'Anda tidak memiliki akses untuk menolak transaksi warnet ini',
        })
      }

      if (transaction.status !== 'pending') {
        return response.badRequest({
          message: 'Transaksi ini sudah diproses',
        })
      }

      // ✅ request sekarang VALID
      const rejectionNote = request.input('rejection_note', null)

      transaction.status = 'failed'
      if (rejectionNote) {
        transaction.rejection_note = rejectionNote
      }

      await transaction.save()

      return response.ok({
        message: 'Top up berhasil ditolak',
        data: {
          id: transaction.id,
          type: transaction.type,
          amount: Number(transaction.amount),
          status: transaction.status,
        },
      })
    } catch (error: any) {
      console.error('Reject error:', error)

      if (error.code === 'E_UNAUTHORIZED_ACCESS') {
        return response.unauthorized({
          message: 'Silakan login terlebih dahulu',
        })
      }

      return response.internalServerError({
        message: 'Terjadi kesalahan saat menolak top up',
      })
    }
  }
}

