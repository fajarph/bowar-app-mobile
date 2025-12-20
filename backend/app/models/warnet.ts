import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import Pc from './pc.js'
import Booking from './booking.js'
import ChatMessage from './chat_message.js'

export default class Warnet extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare address: string

  @column()
  declare description: string | null

  @column()
  declare regular_price_per_hour: number

  @column()
  declare member_price_per_hour: number

  @column()
  declare total_pcs: number

  @column()
  declare phone: string | null

  @column()
  declare email: string | null

  @column()
  declare operating_hours: string | null

  @column()
  declare latitude: number | null

  @column()
  declare longitude: number | null

  @hasMany(() => User, {
    foreignKey: 'warnet_id',
  })
  declare members: HasMany<typeof User>

  @hasMany(() => Pc, {
    foreignKey: 'warnet_id',
  })
  declare pcs: HasMany<typeof Pc>

  @hasMany(() => Booking, {
    foreignKey: 'warnet_id',
  })
  declare bookings: HasMany<typeof Booking>

  @hasMany(() => ChatMessage, {
    foreignKey: 'warnet_id',
  })
  declare chatMessages: HasMany<typeof ChatMessage>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
