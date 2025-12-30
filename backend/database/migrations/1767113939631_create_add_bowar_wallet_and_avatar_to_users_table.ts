import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Saldo DompetBowar dalam Rupiah (default 0)
      table.decimal('bowar_wallet', 15, 2).defaultTo(0).comment('Saldo DompetBowar dalam Rupiah')
      
      // Avatar URL (optional)
      table.string('avatar', 255).nullable().comment('URL avatar user')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('bowar_wallet')
      table.dropColumn('avatar')
    })
  }
}
