import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
    protected tableName = 'cafe_wallets'

    public async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.decimal('balance', 15, 2).defaultTo(0).notNullable()
        })
    }

    public async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('balance')
        })
    }
}
