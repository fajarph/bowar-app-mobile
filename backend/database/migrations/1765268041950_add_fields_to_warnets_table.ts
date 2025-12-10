import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'warnets'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Add pricing fields
      table.decimal('regular_price_per_hour', 10, 2).defaultTo(0).comment('Regular user price per hour')
      table.decimal('member_price_per_hour', 10, 2).defaultTo(0).comment('Member price per hour')
      
      // Add PC count (can be calculated, but stored for quick access)
      table.integer('total_pcs').defaultTo(0).comment('Total number of PCs in this warnet')
      
      // Add additional info
      table.string('phone', 20).nullable()
      table.string('email', 255).nullable()
      table.string('operating_hours').nullable().comment('e.g., "24/7" or "08:00-22:00"')
      
      // Location coordinates (for map)
      table.decimal('latitude', 10, 8).nullable()
      table.decimal('longitude', 11, 8).nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('regular_price_per_hour')
      table.dropColumn('member_price_per_hour')
      table.dropColumn('total_pcs')
      table.dropColumn('phone')
      table.dropColumn('email')
      table.dropColumn('operating_hours')
      table.dropColumn('latitude')
      table.dropColumn('longitude')
    })
  }
}

