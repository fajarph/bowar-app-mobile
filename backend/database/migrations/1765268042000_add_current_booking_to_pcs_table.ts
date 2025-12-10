import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'pcs'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Add reference to current active booking (nullable)
      table.integer('current_booking_id').unsigned().references('id').inTable('bookings').onDelete('SET NULL').nullable().after('status')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('current_booking_id')
    })
  }
}

