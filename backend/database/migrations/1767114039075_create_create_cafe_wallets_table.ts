import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'cafe_wallets'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      
      // Foreign key ke users (member)
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE').notNullable()
      
      // Foreign key ke warnets
      table.integer('warnet_id').unsigned().references('id').inTable('warnets').onDelete('CASCADE').notNullable()
      
      // Sisa waktu dalam menit
      table.integer('remaining_minutes').defaultTo(0).notNullable().comment('Sisa waktu dalam menit')
      
      // Status aktif (true ketika user sedang login di warnet tersebut)
      table.boolean('is_active').defaultTo(false).notNullable().comment('Status aktif saat user login di warnet')
      
      // Timestamp terakhir update
      table.timestamp('last_updated', { useTz: true }).defaultTo(this.now()).notNullable()
      
      // Unique constraint: satu user hanya bisa punya satu wallet per warnet
      table.unique(['user_id', 'warnet_id'])
      
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
