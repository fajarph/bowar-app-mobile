import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

import Warnet from './warnet.js'

export default class Rule extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare warnetId: number

  @column()
  declare code: string

  @column()
  declare description: string | null

  @column()
  declare value: string

  @belongsTo(() => Warnet)
  declare warnet: BelongsTo<typeof Warnet>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
