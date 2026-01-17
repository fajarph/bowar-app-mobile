import type { HttpContext } from '@adonisjs/core/http'
import Booking from '#models/booking'
import User from '#models/user'
import Pc from '#models/pc'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'

export default class OperatorBookingsController {
    /**
     * Get pending payment bookings for operator's warnet
     * GET /operator/bookings/pending
     */
    async pending({ auth, response }: HttpContext) {
        try {
            const operator = auth.user as User

            // Verify user is operator
            if (operator.role !== 'operator') {
                return response.forbidden({
                    message: 'Only operators can access this endpoint',
                })
            }

            if (!operator.warnet_id) {
                return response.badRequest({
                    message: 'Operator must be assigned to a warnet',
                })
            }

            // Get bookings with pending payment status for this warnet
            const bookings = await Booking.query()
                .where('warnet_id', operator.warnet_id)
                .where('payment_status', 'pending')
                .whereNotNull('payment_proof_image') // Only bookings with uploaded proof
                .preload('user')
                .preload('warnet')
                .orderBy('created_at', 'desc')

            return response.ok({
                message: 'Pending bookings retrieved successfully',
                data: bookings.map((b) => b.serialize()),
            })
        } catch (error) {
            console.error('Error fetching pending bookings:', error)
            return response.internalServerError({
                message: 'Failed to fetch pending bookings',
                error: error.message,
            })
        }
    }

    /**
     * Get all bookings for operator's warnet
     * GET /operator/bookings
     */
    async index({ auth, request, response }: HttpContext) {
        try {
            const operator = auth.user as User
            const page = request.input('page', 1)
            const limit = request.input('limit', 50)
            const status = request.input('status')
            const search = request.input('search')

            // Verify user is operator
            if (operator.role !== 'operator') {
                return response.forbidden({
                    message: 'Only operators can access this endpoint',
                })
            }

            if (!operator.warnet_id) {
                return response.badRequest({
                    message: 'Operator must be assigned to a warnet',
                })
            }

            const query = Booking.query()
                .where('warnet_id', operator.warnet_id)
                .preload('user')
                .preload('warnet')
                .orderBy('created_at', 'desc')

            if (status && status !== 'all') {
                if (status === 'pending') {
                    query.where('payment_status', 'pending')
                } else {
                    query.where('status', status)
                }
            }

            if (search) {
                query.whereHas('user', (userQuery) => {
                    userQuery.where('username', 'ilike', `%${search}%`)
                        .orWhere('email', 'ilike', `%${search}%`)
                })
            }

            const bookings = await query.paginate(page, limit)

            return response.ok({
                message: 'Bookings retrieved successfully',
                data: bookings.serialize(),
            })
        } catch (error) {
            console.error('Error fetching operator bookings:', error)
            return response.internalServerError({
                message: 'Failed to fetch bookings',
                error: error.message,
            })
        }
    }


    /**
     * Approve booking payment
     * POST /operator/bookings/:id/approve
     */
    async approve({ auth, params, response }: HttpContext) {
        try {
            const operator = auth.user as User

            // Verify user is operator
            if (operator.role !== 'operator') {
                return response.forbidden({
                    message: 'Only operators can access this endpoint',
                })
            }

            const bookingId = params.id
            const booking = await Booking.find(bookingId)

            if (!booking) {
                return response.notFound({
                    message: 'Booking not found',
                })
            }

            // Verify booking belongs to operator's warnet
            if (booking.warnet_id !== operator.warnet_id) {
                return response.forbidden({
                    message: 'You can only approve bookings for your warnet',
                })
            }

            // Check if already approved or cancelled
            if (booking.payment_status === 'paid') {
                return response.badRequest({
                    message: 'Booking payment already approved',
                })
            }

            if (booking.status === 'cancelled') {
                return response.badRequest({
                    message: 'Cannot approve cancelled booking',
                })
            }

            const trx = await db.connection().transaction()

            try {
                // Update booking status
                booking.payment_status = 'paid'
                booking.status = 'active'
                booking.approved_by = operator.id
                booking.approved_at = DateTime.now()
                booking.useTransaction(trx)
                await booking.save()

                // Update PC status to occupied (ensure record exists)
                await Pc.updateOrCreate(
                    {
                        warnet_id: booking.warnet_id,
                        pc_number: booking.pc_number
                    },
                    {
                        status: 'occupied',
                        current_booking_id: booking.id
                    },
                    { client: trx }
                )

                await trx.commit()

                await booking.load('user')
                await booking.load('warnet')

                return response.ok({
                    message: 'Booking payment approved successfully',
                    data: booking.serialize(),
                })
            } catch (error) {
                await trx.rollback()
                throw error
            }
        } catch (error) {
            console.error('Error approving booking:', error)
            return response.internalServerError({
                message: 'Failed to approve booking',
                error: error.message,
            })
        }
    }

    /**
     * Reject booking payment
     * POST /operator/bookings/:id/reject
     */
    async reject({ auth, params, response }: HttpContext) {
        try {
            const operator = auth.user as User

            // Verify user is operator
            if (operator.role !== 'operator') {
                return response.forbidden({
                    message: 'Only operators can access this endpoint',
                })
            }

            const bookingId = params.id
            const booking = await Booking.find(bookingId)

            if (!booking) {
                return response.notFound({
                    message: 'Booking not found',
                })
            }

            // Verify booking belongs to operator's warnet
            if (booking.warnet_id !== operator.warnet_id) {
                return response.forbidden({
                    message: 'You can only reject bookings for your warnet',
                })
            }

            // Check if already approved or cancelled
            if (booking.payment_status === 'paid') {
                return response.badRequest({
                    message: 'Cannot reject already approved booking',
                })
            }

            if (booking.status === 'cancelled') {
                return response.badRequest({
                    message: 'Booking already cancelled',
                })
            }

            // Update booking status
            booking.payment_status = 'rejected'
            booking.status = 'cancelled'
            await booking.save()

            await booking.load('user')
            await booking.load('warnet')

            return response.ok({
                message: 'Booking payment rejected',
                data: booking.serialize(),
            })
        } catch (error) {
            console.error('Error rejecting booking:', error)
            return response.internalServerError({
                message: 'Failed to reject booking',
                error: error.message,
            })
        }
    }
}