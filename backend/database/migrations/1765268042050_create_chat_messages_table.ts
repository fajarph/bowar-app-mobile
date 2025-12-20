import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'chat_messages'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      
      // Conversation context
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE').notNullable().comment('User yang memulai chat')
      table.integer('warnet_id').unsigned().references('id').inTable('warnets').onDelete('CASCADE').notNullable().comment('Warnet yang dihubungi (operator)')
      
      // Message details
      table.integer('sender_id').unsigned().references('id').inTable('users').onDelete('CASCADE').notNullable().comment('User yang mengirim pesan (bisa user biasa atau operator)')
      table.enum('sender_type', ['user', 'operator']).notNullable().comment('Tipe pengirim pesan')
      table.text('message').notNullable()
      
      // Read status
      table.boolean('is_read').defaultTo(false)
      table.timestamp('read_at').nullable()
      
      table.timestamps(true)
      
      // Indexes for better query performance
      table.index(['user_id', 'warnet_id'])
      table.index(['warnet_id'])
      table.index(['sender_id'])
      table.index(['is_read'])
      table.index(['created_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

