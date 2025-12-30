import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'warnets'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Image URL untuk warnet
      table.string('image', 500).nullable().comment('URL gambar warnet')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('image')
    })
  }
}
