import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Warnet from './warnet.js'
import Booking from './booking.js'

export default class Pc extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare warnet_id: number

  @column()
  declare pc_number: number

  @column()
  declare status: 'available' | 'occupied' | 'maintenance'

  @column()
  declare current_booking_id: number | null

  @belongsTo(() => Warnet, {
    foreignKey: 'warnet_id',
  })
  declare warnet: BelongsTo<typeof Warnet>

  @belongsTo(() => Booking, {
    foreignKey: 'current_booking_id',
  })
  declare currentBooking: BelongsTo<typeof Booking>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}

