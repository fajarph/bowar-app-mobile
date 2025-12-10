import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      
      table.string('username').notNullable().unique()
      table.string('email').notNullable().unique()
      table.string('password').notNullable()

      table.enum('role', ['user', 'member']).notNullable().defaultTo('user')

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