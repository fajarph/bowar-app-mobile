import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
    protected tableName = 'bowar_transactions'

    public async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.integer('warnet_id').unsigned().references('id').inTable('warnets').onDelete('CASCADE').nullable()
        })
    }

    public async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('warnet_id')
        })
    }
}
