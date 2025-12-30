import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'

import Warnet from './warnet.js'
import Booking from './booking.js'
import Payment from './payment.js'
import ChatMessage from './chat_message.js'
import CafeWallet from './cafe_wallet.js'
import BowarTransaction from './bowar_transaction.js'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email', 'username'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare username: string

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare password: string

  @column()
  declare role: 'user' | 'member' | 'operator'

  @column()
  declare warnet_id: number | null

  @column()
  declare bowar_wallet: number

  @column()
  declare avatar: string | null

  @belongsTo(() => Warnet, {
    foreignKey: 'warnet_id',
  })
  declare warnet: BelongsTo<typeof Warnet>

  @hasMany(() => Booking, {
    foreignKey: 'user_id',
  })
  declare bookings: HasMany<typeof Booking>

  @hasMany(() => Payment, {
    foreignKey: 'approved_by',
  })
  declare approvedPayments: HasMany<typeof Payment>

  @hasMany(() => ChatMessage, {
    foreignKey: 'user_id',
  })
  declare chatConversations: HasMany<typeof ChatMessage>

  @hasMany(() => ChatMessage, {
    foreignKey: 'sender_id',
  })
  declare sentMessages: HasMany<typeof ChatMessage>

  @hasMany(() => CafeWallet, {
    foreignKey: 'user_id',
  })
  declare cafeWallets: HasMany<typeof CafeWallet>

  @hasMany(() => BowarTransaction, {
    foreignKey: 'user_id',
  })
  declare bowarTransactions: HasMany<typeof BowarTransaction>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  static accessTokens = DbAccessTokensProvider.forModel(User)
}
