import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import Warnet from './warnet.js'

export default class CafeWallet extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare user_id: number

  @column()
  declare warnet_id: number

  @column()
  declare remaining_minutes: number

  @column()
  declare balance: number

  @column()
  declare is_active: boolean

  @column.dateTime()
  declare last_updated: DateTime

  @belongsTo(() => User, {
    foreignKey: 'user_id',
  })
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Warnet, {
    foreignKey: 'warnet_id',
  })
  declare warnet: BelongsTo<typeof Warnet>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}

