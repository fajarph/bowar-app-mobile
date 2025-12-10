import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'payments'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      
      table.integer('booking_id').unsigned().references('id').inTable('bookings').onDelete('CASCADE').notNullable()
      
      // Payment details
      table.enum('payment_method', ['gopay', 'ovo', 'dana', 'shopeepay', 'linkaja', 'bank_transfer', 'credit_card', 'qris']).notNullable()
      table.decimal('amount', 10, 2).notNullable()
      
      // Status and approval
      table.enum('status', ['pending', 'approved', 'rejected']).notNullable().defaultTo('pending')
      table.integer('approved_by').unsigned().references('id').inTable('users').onDelete('SET NULL').nullable().comment('Operator who approved/rejected')
      table.timestamp('approved_at').nullable()
      
      // Additional info
      table.text('notes').nullable().comment('Operator notes or rejection reason')
      table.string('transaction_reference').nullable().comment('Payment gateway reference if any')
      
      table.timestamps(true)
      
      // Indexes
      table.index(['booking_id'])
      table.index(['status'])
      table.index(['approved_by'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

