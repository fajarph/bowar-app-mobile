import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import Warnet from './warnet.js'

export default class ChatMessage extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare user_id: number

  @column()
  declare warnet_id: number

  @column()
  declare sender_id: number

  @column()
  declare sender_type: 'user' | 'operator'

  @column()
  declare message: string

  @column()
  declare is_read: boolean

  @column.dateTime()
  declare read_at: DateTime | null

  @belongsTo(() => User, {
    foreignKey: 'user_id',
  })
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Warnet, {
    foreignKey: 'warnet_id',
  })
  declare warnet: BelongsTo<typeof Warnet>

  @belongsTo(() => User, {
    foreignKey: 'sender_id',
  })
  declare sender: BelongsTo<typeof User>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  /**
   * Mark message as read
   */
  async markAsRead() {
    this.is_read = true
    this.read_at = DateTime.now()
    await this.save()
  }

  /**
   * Check if message is unread
   */
  isUnread(): boolean {
    return !this.is_read
  }
}

