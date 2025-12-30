import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'warnets'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Bank account information for BCA transfer
      table.string('bank_account_number', 50).nullable().comment('Nomor rekening BCA warnet')
      table.string('bank_account_name', 255).nullable().comment('Atas nama rekening warnet')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('bank_account_number')
      table.dropColumn('bank_account_name')
    })
  }
}