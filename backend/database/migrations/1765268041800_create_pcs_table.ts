import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'pcs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      
      table.integer('warnet_id').unsigned().references('id').inTable('warnets').onDelete('CASCADE').notNullable()
      table.integer('pc_number').notNullable()
      table.enum('status', ['available', 'occupied', 'maintenance']).notNullable().defaultTo('available')
      
      table.timestamps(true)
      
      // Ensure unique PC number per warnet
      table.unique(['warnet_id', 'pc_number'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

