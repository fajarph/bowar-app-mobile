import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'bowar_transactions'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Operator yang menyetujui top up (untuk audit trail)
      table.integer('approved_by').unsigned().references('id').inTable('users').onDelete('SET NULL').nullable().comment('ID operator yang menyetujui top up')
      
      // Waktu approval
      table.timestamp('approved_at', { useTz: true }).nullable().comment('Waktu top up disetujui')
      
      // Catatan rejection (jika ditolak)
      table.string('rejection_note', 500).nullable().comment('Alasan penolakan top up')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('approved_by')
      table.dropColumn('approved_at')
      table.dropColumn('rejection_note')
    })
  }
}
