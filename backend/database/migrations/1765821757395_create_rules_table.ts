import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'rules'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
        .integer('warnet_id')
        .unsigned()
        .references('id')
        .inTable('warnets')
        .onDelete('CASCADE')

      table.string('code').notNullable()
      table.text('description').nullable()
      table.string('value').notNullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
