import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasOne } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasOne } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import Warnet from './warnet.js'
import Payment from './payment.js'

export default class Booking extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare user_id: number

  @column()
  declare warnet_id: number

  @column()
  declare pc_number: number

  @column.date()
  declare booking_date: DateTime

  @column()
  declare booking_time: string

  @column()
  declare duration: number

  @column()
  declare status: 'pending' | 'active' | 'completed' | 'cancelled'

  @column()
  declare payment_status: 'pending' | 'paid' | 'rejected'

  @column.dateTime()
  declare session_start_time: DateTime | null

  @column.dateTime()
  declare session_end_time: DateTime | null

  @column()
  declare is_session_active: boolean

  @column()
  declare price_per_hour: number

  @column()
  declare total_price: number

  @column()
  declare is_member_booking: boolean

  @column.dateTime()
  declare can_cancel_until: DateTime | null

  @column()
  declare payment_proof_image: string | null

  @column()
  declare payment_account_name: string | null

  @column()
  declare payment_notes: string | null

  @column()
  declare approved_by: number | null

  @column.dateTime()
  declare approved_at: DateTime | null

  @belongsTo(() => User, {
    foreignKey: 'user_id',
  })
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Warnet, {
    foreignKey: 'warnet_id',
  })
  declare warnet: BelongsTo<typeof Warnet>

  @hasOne(() => Payment, {
    foreignKey: 'booking_id',
  })
  declare payment: HasOne<typeof Payment>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  /**
   * Check if booking can be cancelled (within 2 minutes window)
   */
  canCancel(): boolean {
    if (!this.can_cancel_until) return false
    return DateTime.now() < this.can_cancel_until
  }

  /**
   * Get remaining session time in minutes
   */
  getRemainingMinutes(): number | null {
    if (!this.is_session_active || !this.session_start_time) return null

    const now = DateTime.now()
    const start = this.session_start_time
    const elapsed = now.diff(start, 'minutes').minutes
    const totalMinutes = this.duration * 60
    const remaining = Math.max(0, totalMinutes - elapsed)

    return Math.floor(remaining)
  }
}

