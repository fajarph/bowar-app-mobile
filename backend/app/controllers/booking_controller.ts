import type { HttpContext } from '@adonisjs/core/http'
import Booking from '#models/booking'
import User from '#models/user'
import Warnet from '#models/warnet'
import Pc from '#models/pc'
import CafeWallet from '#models/cafe_wallet'
import BowarTransaction from '#models/bowar_transaction'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'

export default class BookingController {
    /**
     * Create a new booking
     * POST /bookings
     */
    async create({ auth, request, response }: HttpContext) {
        try {
            const user = auth.user as User

            const {
                warnetId,
                pcNumber,
                bookingDate,
                bookingTime,
                duration,
                paymentMethod,
                paymentAccountName,
                paymentNotes,
            } = request.only(['warnetId', 'pcNumber', 'bookingDate', 'bookingTime', 'duration', 'paymentMethod', 'paymentAccountName', 'paymentNotes'])

            // Handle file upload for bank transfer
            const paymentProofImage = request.file('paymentProofImage', {
                size: '15mb',
                extnames: ['jpg', 'jpeg', 'png', 'gif', 'webp']
            })

            // Validation
            if (!warnetId || !pcNumber || !bookingDate || !bookingTime || !duration || !paymentMethod) {
                return response.badRequest({
                    message: 'Missing required fields',
                    errors: {
                        warnetId: !warnetId ? 'Warnet ID is required' : undefined,
                        pcNumber: !pcNumber ? 'PC number is required' : undefined,
                        bookingDate: !bookingDate ? 'Booking date is required' : undefined,
                        bookingTime: !bookingTime ? 'Booking time is required' : undefined,
                        duration: !duration ? 'Duration is required' : undefined,
                        paymentMethod: !paymentMethod ? 'Payment method is required' : undefined,
                    },
                })
            }

            // Validate bank transfer requirements
            if (paymentMethod === 'bank_transfer') {
                if (!paymentAccountName) {
                    return response.badRequest({
                        message: 'Account name is required for bank transfer',
                    })
                }
                if (!paymentProofImage) {
                    return response.badRequest({
                        message: 'Payment proof image is required for bank transfer',
                    })
                }
            }

            // Check if user is a member for validation
            const isMemberBooking = user.role === 'member' && user.warnet_id === warnetId

            // Member booking rule: duration must be > 1 hour
            if (isMemberBooking && duration <= 1) {
                return response.badRequest({
                    message: 'Member booking must be more than 1 hour',
                    errors: {
                        duration: 'Member booking requires a minimum duration of more than 1 hour (e.g., 2 hours)',
                    },
                })
            }

            // Get warnet details for pricing
            const warnet = await Warnet.find(warnetId)
            if (!warnet) {
                return response.notFound({
                    message: 'Warnet not found',
                })
            }

            // Calculate pricing
            const pricePerHour = isMemberBooking
                ? warnet.member_price_per_hour
                : warnet.regular_price_per_hour
            const totalPrice = pricePerHour * duration

            // Check PC availability (optional - can be enhanced later)
            const pc = await Pc.query()
                .where('warnet_id', warnetId)
                .where('pc_number', pcNumber)
                .first()

            if (pc && pc.status === 'maintenance') {
                return response.badRequest({
                    message: 'PC is under maintenance',
                })
            }

            // Process file upload if bank transfer
            let uploadedFilePath: string | null = null
            if (paymentMethod === 'bank_transfer' && paymentProofImage) {
                const fileName = `${Date.now()}_${paymentProofImage.clientName}`
                await paymentProofImage.move('public/uploads/payment-proofs', {
                    name: fileName,
                    overwrite: true,
                })

                if (paymentProofImage.hasErrors) {
                    return response.badRequest({
                        message: 'File upload failed',
                        errors: paymentProofImage.errors,
                    })
                }

                uploadedFilePath = `/uploads/payment-proofs/${fileName}`
            }

            // Start transaction
            const trx = await db.connection().transaction()

            try {
                // Create booking
                const booking = new Booking()
                booking.user_id = user.id
                booking.warnet_id = warnetId
                booking.pc_number = pcNumber
                booking.booking_date = DateTime.fromISO(bookingDate)
                booking.booking_time = bookingTime
                booking.duration = duration
                booking.status = 'pending'
                booking.payment_status = 'pending'
                booking.is_session_active = false
                booking.price_per_hour = pricePerHour
                booking.total_price = totalPrice
                booking.is_member_booking = isMemberBooking

                // Add payment proof data if bank transfer
                if (paymentMethod === 'bank_transfer') {
                    booking.payment_proof_image = uploadedFilePath
                    booking.payment_account_name = paymentAccountName
                    booking.payment_notes = paymentNotes || null
                }

                // Set cancel window: 2 minutes from now
                booking.can_cancel_until = DateTime.now().plus({ minutes: 2 })

                booking.useTransaction(trx)
                await booking.save()

                // Handle payment based on method
                if (paymentMethod === 'dompet_bowar') {
                    // Check per-warnet balance
                    const cafeWallet = await CafeWallet.query()
                        .where('user_id', user.id)
                        .where('warnet_id', warnetId)
                        .useTransaction(trx)
                        .first()

                    if (!cafeWallet || Number(cafeWallet.balance) < Number(totalPrice)) {
                        await trx.rollback()
                        return response.badRequest({
                            message: 'Saldo Warnet ini tidak cukup. Silakan top up khusus di warnet ini.',
                            data: {
                                required: totalPrice,
                                available: cafeWallet ? cafeWallet.balance : 0,
                            },
                        })
                    }

                    // Deduct from cafe wallet balance
                    cafeWallet.balance = Number(cafeWallet.balance) - Number(totalPrice)
                    await cafeWallet.save()

                    // Create transaction record
                    const transaction = new BowarTransaction()
                    transaction.user_id = user.id
                    transaction.type = 'payment'
                    transaction.amount = -totalPrice // Negative for payment
                    transaction.description = `Payment for booking at ${warnet.name} - PC #${pcNumber}`
                    transaction.booking_id = booking.id
                    transaction.warnet_id = warnetId
                    transaction.status = 'completed'
                    transaction.useTransaction(trx)
                    await transaction.save()

                    // Update booking payment status
                    booking.payment_status = 'paid'
                    booking.status = 'active'
                    await booking.save()
                } else {
                    // Other payment methods require approval
                    // Booking stays as pending, payment_status = pending
                    // Operator will approve later
                }

                // Update PC status if payment is completed (ensure record exists)
                if (booking.payment_status === 'paid') {
                    await Pc.updateOrCreate(
                        {
                            warnet_id: warnetId,
                            pc_number: pcNumber
                        },
                        {
                            status: 'occupied',
                            current_booking_id: booking.id
                        },
                        { client: trx }
                    )
                }

                await trx.commit()

                // Load warnet details for response
                await booking.load('warnet')

                return response.created({
                    message: 'Booking created successfully',
                    data: booking.serialize(),
                })
            } catch (error) {
                await trx.rollback()
                throw error
            }
        } catch (error) {
            console.error('Error creating booking:', error)
            return response.internalServerError({
                message: 'Failed to create booking',
                error: error.message,
            })
        }
    }

    /**
     * Get booking history for authenticated user
     * GET /bookings
     */
    async index({ auth, request, response }: HttpContext) {
        try {
            const user = auth.user as User
            const page = request.input('page', 1)
            const limit = request.input('limit', 20)

            const bookings = await Booking.query()
                .where('user_id', user.id)
                .preload('warnet')
                .orderBy('created_at', 'desc')
                .paginate(page, limit)

            return response.ok({
                message: 'Bookings retrieved successfully',
                data: bookings.serialize(),
            })
        } catch (error) {
            console.error('Error fetching bookings:', error)
            return response.internalServerError({
                message: 'Failed to fetch bookings',
                error: error.message,
            })
        }
    }

    /**
     * Cancel a booking (within 2-minute window)
     * POST /bookings/:id/cancel
     */
    async cancel({ auth, params, response }: HttpContext) {
        try {
            const user = auth.user as User
            const bookingId = params.id

            // Find booking
            const booking = await Booking.find(bookingId)

            if (!booking) {
                return response.notFound({
                    message: 'Booking not found',
                })
            }

            // Check ownership
            if (booking.user_id !== user.id) {
                return response.forbidden({
                    message: 'You are not authorized to cancel this booking',
                })
            }

            // Check if already cancelled or completed
            if (booking.status === 'cancelled') {
                return response.badRequest({
                    message: 'Booking is already cancelled',
                })
            }

            if (booking.status === 'completed') {
                return response.badRequest({
                    message: 'Cannot cancel a completed booking',
                })
            }

            // Check if within cancel window using model method
            if (!booking.canCancel()) {
                return response.badRequest({
                    message: 'Cancel window has expired',
                    data: {
                        can_cancel_until: booking.can_cancel_until?.toISO(),
                        current_time: DateTime.now().toISO(),
                    },
                })
            }

            // Start transaction
            const trx = await db.connection().transaction()

            try {
                // Update booking status
                booking.status = 'cancelled'
                booking.useTransaction(trx)
                await booking.save()

                // Refund if payment was made via DompetBowar
                if (booking.payment_status === 'paid') {
                    // Find the payment transaction
                    const paymentTransaction = await BowarTransaction.query()
                        .where('booking_id', booking.id)
                        .where('type', 'payment')
                        .first()

                    if (paymentTransaction) {
                        // Refund to specific cafe wallet - ensure numeric addition
                        let cafeWallet = await CafeWallet.query()
                            .where('user_id', user.id)
                            .where('warnet_id', booking.warnet_id)
                            .useTransaction(trx)
                            .first()

                        if (!cafeWallet) {
                            // Should theoretically exist if payment was made, but create if missing
                            cafeWallet = new CafeWallet()
                            cafeWallet.user_id = user.id
                            cafeWallet.warnet_id = booking.warnet_id
                            cafeWallet.balance = 0
                            cafeWallet.remaining_minutes = 0
                            cafeWallet.is_active = false
                            cafeWallet.useTransaction(trx)
                        }

                        cafeWallet.balance = Number(cafeWallet.balance) + Number(booking.total_price)
                        await cafeWallet.save()

                        // Create refund transaction
                        const refundTransaction = new BowarTransaction()
                        refundTransaction.user_id = user.id
                        refundTransaction.type = 'refund'
                        refundTransaction.amount = booking.total_price
                        refundTransaction.description = `Refund for cancelled booking (Warnet ID: ${booking.warnet_id}) - PC #${booking.pc_number}`
                        refundTransaction.booking_id = booking.id
                        refundTransaction.warnet_id = booking.warnet_id
                        refundTransaction.status = 'completed'
                        refundTransaction.useTransaction(trx)
                        await refundTransaction.save()
                    }
                }

                // Free up PC if it was occupied
                const pc = await Pc.query()
                    .where('warnet_id', booking.warnet_id)
                    .where('pc_number', booking.pc_number)
                    .where('current_booking_id', booking.id)
                    .first()

                if (pc) {
                    pc.status = 'available'
                    pc.current_booking_id = null
                    pc.useTransaction(trx)
                    await pc.save()
                }

                await trx.commit()

                return response.ok({
                    message: 'Booking cancelled successfully',
                    data: {
                        booking: booking.serialize(),
                        refunded: booking.payment_status === 'paid' ? booking.total_price : 0,
                    },
                })
            } catch (error) {
                await trx.rollback()
                throw error
            }
        } catch (error) {
            console.error('Error cancelling booking:', error)
            console.error('Error stack:', error.stack)
            console.error('Error details:', JSON.stringify(error, null, 2))
            return response.internalServerError({
                message: 'Failed to cancel booking',
                error: error.message,
                details: error.stack,
            })
        }
    }
}
