import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'bowar_transactions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      
      // Foreign key ke users
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE').notNullable()
      
      // Tipe transaksi: topup, payment, refund
      table.enum('type', ['topup', 'payment', 'refund']).notNullable()
      
      // Jumlah transaksi (positif untuk topup/refund, negatif untuk payment)
      table.decimal('amount', 15, 2).notNullable().comment('Jumlah transaksi dalam Rupiah')
      
      // Deskripsi transaksi
      table.string('description', 500).nullable()
      
      // Foreign key ke bookings (nullable, hanya untuk payment/refund)
      table.integer('booking_id').unsigned().references('id').inTable('bookings').onDelete('SET NULL').nullable()
      
      // Status transaksi (untuk topup via transfer)
      table.enum('status', ['pending', 'completed', 'failed']).defaultTo('completed').notNullable()
      
      // Bukti transfer (untuk topup via transfer)
      table.string('proof_image', 500).nullable().comment('URL bukti transfer')
      
      // Nama pengirim (untuk topup via transfer)
      table.string('sender_name', 255).nullable()
      
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
