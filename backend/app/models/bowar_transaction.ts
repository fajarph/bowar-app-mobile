import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import Booking from './booking.js'
import Warnet from './warnet.js'

export default class BowarTransaction extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare user_id: number

  @column()
  declare type: 'topup' | 'payment' | 'refund'

  @column()
  declare amount: number

  @column()
  declare description: string | null

  @column()
  declare booking_id: number | null

  @column()
  declare warnet_id: number | null

  @column()
  declare status: 'pending' | 'completed' | 'failed'

  @column()
  declare proof_image: string | null

  @column()
  declare sender_name: string | null

  @column()
  declare approved_by: number | null

  @column.dateTime()
  declare approved_at: DateTime | null

  @column()
  declare rejection_note: string | null

  @belongsTo(() => User, {
    foreignKey: 'user_id',
  })
  declare user: BelongsTo<typeof User>

  @belongsTo(() => User, {
    foreignKey: 'approved_by',
  })
  declare approver: BelongsTo<typeof User> | null

  @belongsTo(() => Booking, {
    foreignKey: 'booking_id',
  })
  declare booking: BelongsTo<typeof Booking> | null

  @belongsTo(() => Warnet, {
    foreignKey: 'warnet_id',
  })
  declare warnet: BelongsTo<typeof Warnet> | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}

