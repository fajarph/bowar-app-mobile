import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Change avatar from varchar(255) to text to support base64 images
      table.text('avatar').nullable().alter().comment('URL atau base64 avatar user')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      // Revert back to varchar(255)
      table.string('avatar', 255).nullable().alter()
    })
  }
}
