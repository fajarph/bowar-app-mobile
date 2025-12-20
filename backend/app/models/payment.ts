import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Booking from './booking.js'
import User from './user.js'

export default class Payment extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare booking_id: number

  @column()
  declare payment_method: 'gopay' | 'ovo' | 'dana' | 'shopeepay' | 'linkaja' | 'bank_transfer' | 'credit_card' | 'qris'

  @column()
  declare amount: number

  @column()
  declare status: 'pending' | 'approved' | 'rejected'

  @column()
  declare approved_by: number | null

  @column.dateTime()
  declare approved_at: DateTime | null

  @column()
  declare notes: string | null

  @column()
  declare transaction_reference: string | null

  @belongsTo(() => Booking, {
    foreignKey: 'booking_id',
  })
  declare booking: BelongsTo<typeof Booking>

  @belongsTo(() => User, {
    foreignKey: 'approved_by',
  })
  declare approver: BelongsTo<typeof User>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  /**
   * Check if payment can be cancelled (within 2 minutes after creation)
   */
  canCancel(): boolean {
    const cancelDeadline = this.createdAt.plus({ minutes: 2 })
    return DateTime.now() < cancelDeadline
  }
}

