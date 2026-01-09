import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Remove unique constraint from email column
      // This allows multiple users to have the same email (for multiple memberships)
      table.dropUnique(['email'])
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      // Re-add unique constraint on email
      table.unique('email')
    })
  }
}
