import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'bookings'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('payment_proof_image').nullable()
      table.string('payment_account_name').nullable()
      table.text('payment_notes').nullable()
      table.integer('approved_by').unsigned().nullable().references('id').inTable('users').onDelete('SET NULL')
      table.timestamp('approved_at').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('payment_proof_image')
      table.dropColumn('payment_account_name')
      table.dropColumn('payment_notes')
      table.dropColumn('approved_by')
      table.dropColumn('approved_at')
    })
  }
}