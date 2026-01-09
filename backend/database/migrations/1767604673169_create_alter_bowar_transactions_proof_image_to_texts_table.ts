import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'bowar_transactions'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Change proof_image from varchar(500) to text to support base64 images
      table.text('proof_image').nullable().alter().comment('URL atau base64 bukti transfer')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      // Revert back to varchar(500)
      table.string('proof_image', 500).nullable().alter()
    })
  }
}
