import { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import BowarTransaction from '#models/bowar_transaction'
import User from '#models/user'
import Booking from '#models/booking'

export default class BowarTransactionController {
  /**
   * GET /bowar-transactions - Get all transactions for authenticated user
   * Returns transaction history for DompetBowar
   * For operators: returns all pending topups if status=pending query param is provided
   */
  async index({ auth, request, response }: HttpContext) {
    try {
      // Check authentication
      await auth.check()
      const user = auth.user!
      
      // Log for debugging
      console.log('📊 BowarTransaction index - User:', user.username, 'Role:', user.role, 'ID:', user.id)

      const page = request.input('page', 1)
      const limit = request.input('limit', 20)
      const status = request.input('status') // 'pending', 'completed', 'failed', or undefined for all
      const type = request.input('type') // 'topup', 'payment', 'refund', or undefined for all

      let query = BowarTransaction.query()

      // If operator and requesting topups, return all topups (not filtered by user_id)
      if (user.role === 'operator' && type === 'topup') {
        query = query.where('type', 'topup')
        // Apply status filter if provided
        if (status) {
          query = query.where('status', status)
        }
      } else {
        // Regular users only see their own transactions
        query = query.where('user_id', user.id)
        
        // Apply filters for regular users
        if (status) {
          query = query.where('status', status)
        }
        if (type) {
          query = query.where('type', type)
        }
      }

      const transactions = await query
        .orderBy('created_at', 'desc')
        .paginate(page, limit)

      // For operators viewing pending topups, include user info
      const transactionData = transactions.serialize().data.map(async (tx: any) => {
        const baseData = {
          id: tx.id,
          type: tx.type,
          amount: parseFloat(tx.amount),
          description: tx.description,
          status: tx.status,
          createdAt: tx.created_at,
          proofImage: tx.proof_image,
          senderName: tx.sender_name,
        }

        // If operator viewing topups, include user info
        if (user.role === 'operator' && type === 'topup') {
          const transactionUser = await User.find(tx.user_id)
          return {
            ...baseData,
            userId: tx.user_id,
            username: transactionUser?.username || 'Unknown',
            email: transactionUser?.email || 'Unknown',
          }
        }

        return baseData
      })

      const resolvedData = await Promise.all(transactionData)

      return response.ok({
        message: 'Riwayat transaksi berhasil diambil',
        data: resolvedData,
        meta: transactions.serialize().meta,
      })
    } catch {
      return response.unauthorized({
        message: 'Silakan login terlebih dahulu',
      })
    }
  }

  /**
   * GET /bowar-transactions/:id - Get transaction detail
   */
  async show({ auth, params, response }: HttpContext) {
    try {
      await auth.check()
      const user = auth.user!

      const transaction = await BowarTransaction.find(params.id)
      if (!transaction) {
        return response.notFound({
          message: 'Transaksi tidak ditemukan',
        })
      }

      // Verify transaction belongs to user
      if (transaction.user_id !== user.id) {
        return response.forbidden({
          message: 'Anda tidak memiliki akses ke transaksi ini',
        })
      }

      await transaction.load('booking')

      return response.ok({
        message: 'Detail transaksi berhasil diambil',
        data: {
          id: transaction.id,
          type: transaction.type,
          amount: parseFloat(transaction.amount.toString()),
          description: transaction.description,
          status: transaction.status,
          proofImage: transaction.proof_image,
          senderName: transaction.sender_name,
          bookingId: transaction.booking_id,
          createdAt: transaction.createdAt.toISO(),
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

      const { amount, description, proofImage, senderName } = request.only([
        'amount',
        'description',
        'proofImage',
        'senderName',
      ])

      if (!amount || amount <= 0) {
        return response.badRequest({
          message: 'Jumlah top up harus lebih dari 0',
        })
      }

      if (!proofImage || !senderName) {
        return response.badRequest({
          message: 'Bukti transfer dan nama pengirim wajib diisi',
        })
      }

      // Validate proofImage is base64 string
      if (typeof proofImage !== 'string' || proofImage.length === 0) {
        return response.badRequest({
          message: 'Bukti transfer tidak valid',
        })
      }

      // Create pending transaction
      const transaction = await BowarTransaction.create({
        user_id: user.id,
        type: 'topup',
        amount: amount,
        description: description || `Top Up DompetBowar sebesar Rp ${amount.toLocaleString()}`,
        status: 'pending',
        proof_image: proofImage,
        sender_name: senderName,
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

      // Check user balance
      if (!user.bowar_wallet || user.bowar_wallet < amount) {
        return response.badRequest({
          message: 'Saldo DompetBowar tidak cukup',
        })
      }

      // Deduct from user balance
      user.bowar_wallet -= amount
      await user.save()

      // Create payment transaction
      const transaction = await BowarTransaction.create({
        user_id: user.id,
        type: 'payment',
        amount: -amount, // Negative for payment
        description: description || `Pembayaran booking #${bookingId}`,
        booking_id: bookingId,
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

      // Add to user balance
      user.bowar_wallet = (user.bowar_wallet || 0) + amount
      await user.save()

      // Create refund transaction
      const transaction = await BowarTransaction.create({
        user_id: user.id,
        type: 'refund',
        amount: amount,
        description: description || `Refund untuk booking #${bookingId || 'N/A'}`,
        booking_id: bookingId || null,
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

      // Add balance to user
      transactionOwner.bowar_wallet = (transactionOwner.bowar_wallet || 0) + parseFloat(transaction.amount.toString())
      await transactionOwner.save()

      // Update transaction status and save approval info
      transaction.status = 'completed'
      transaction.approved_by = user.id
      transaction.approved_at = DateTime.now()
      await transaction.save()

      return response.ok({
        message: 'Top up berhasil disetujui',
        data: {
          id: transaction.id,
          type: transaction.type,
          amount: parseFloat(transaction.amount.toString()),
          status: transaction.status,
          newBalance: transactionOwner.bowar_wallet,
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
  async reject({ auth, params, response }: HttpContext) {
    try {
      await auth.check()
      const user = auth.user!

      // Only operator/admin can reject
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

      if (transaction.status !== 'pending') {
        return response.badRequest({
          message: 'Transaksi ini sudah diproses',
        })
      }

      // Get rejection note from request body (optional)
      const rejectionNote = request.input('rejection_note', null)

      // Update transaction status
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
          amount: parseFloat(transaction.amount.toString()),
          status: transaction.status,
        },
      })
    } catch (error: any) {
      console.error('Reject error:', error)
      return response.internalServerError({
        message: 'Terjadi kesalahan saat menolak top up',
      })
    }
  }
}

