import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'bookings'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE').notNullable()
      table.integer('warnet_id').unsigned().references('id').inTable('warnets').onDelete('CASCADE').notNullable()
      table.integer('pc_number').notNullable()
      
      // Booking details
      table.date('booking_date').notNullable()
      table.time('booking_time').notNullable()
      table.integer('duration').notNullable().comment('Duration in hours')
      
      // Status
      table.enum('status', ['pending', 'active', 'completed', 'cancelled']).notNullable().defaultTo('pending')
      table.enum('payment_status', ['pending', 'paid', 'rejected']).notNullable().defaultTo('pending')
      
      // Session tracking
      table.timestamp('session_start_time').nullable().comment('When user actually starts the session')
      table.timestamp('session_end_time').nullable().comment('When session ends')
      table.boolean('is_session_active').defaultTo(false)
      
      // Pricing (store at time of booking for history)
      table.decimal('price_per_hour', 10, 2).notNullable()
      table.decimal('total_price', 10, 2).notNullable()
      table.boolean('is_member_booking').defaultTo(false)
      
      // Cancel window tracking
      table.timestamp('can_cancel_until').nullable().comment('Deadline for cancellation (2 minutes after payment)')
      
      table.timestamps(true)
      
      // Indexes for better query performance
      table.index(['user_id'])
      table.index(['warnet_id'])
      table.index(['status'])
      table.index(['payment_status'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

