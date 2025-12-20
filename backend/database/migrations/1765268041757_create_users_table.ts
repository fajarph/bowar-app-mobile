import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      
      table.string('username', 255).notNullable().unique()
      table.string('email', 255).notNullable().unique()
      // Scrypt hash menghasilkan string panjang, jadi gunakan text atau string dengan length cukup
      table.string('password', 255).notNullable()

      // Tambahkan 'operator' ke enum role
      table.enum('role', ['user', 'member', 'operator']).notNullable().defaultTo('user')

      // khusus member
      table.integer('warnet_id').unsigned().references('id').inTable('warnets').onDelete('SET NULL').nullable()

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}