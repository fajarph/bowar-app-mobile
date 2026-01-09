import { BaseCommand, args, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import User from '#models/user'
import Warnet from '#models/warnet'

export default class CreateOperator extends BaseCommand {
  static commandName = 'create:operator'
  static description = 'Membuat akun operator baru'

  static options: CommandOptions = {
    startApp: true,
  }

  @args.string({ description: 'Username untuk operator' })
  declare username: string

  @args.string({ description: 'Email untuk operator' })
  declare email: string

  @args.string({ description: 'Password untuk operator' })
  declare password: string

  @flags.number({ description: 'ID warnet yang akan dikelola operator' })
  declare warnetId: number

  @flags.string({ description: 'Nama warnet (alternatif dari warnetId)' })
  declare warnetName: string

  async run() {
    // Validate inputs
    if (!this.username || !this.email || !this.password) {
      this.logger.error('❌ Username, email, dan password wajib diisi!')
      this.logger.info('Contoh: node ace create:operator operator1 operator1@bowar.com password123 --warnetId=1')
      return
    }

    // Check if username already exists
    const existingUser = await User.findBy('username', this.username)
    if (existingUser) {
      this.logger.error(`❌ Username "${this.username}" sudah digunakan!`)
      return
    }

    // Check if email already exists
    const existingEmail = await User.findBy('email', this.email)
    if (existingEmail) {
      this.logger.error(`❌ Email "${this.email}" sudah digunakan!`)
      return
    }

    // Find warnet
    let warnet = null
    if (this.warnetId) {
      warnet = await Warnet.find(this.warnetId)
      if (!warnet) {
        this.logger.error(`❌ Warnet dengan ID ${this.warnetId} tidak ditemukan!`)
        return
      }
    } else if (this.warnetName) {
      warnet = await Warnet.findBy('name', this.warnetName)
      if (!warnet) {
        this.logger.error(`❌ Warnet dengan nama "${this.warnetName}" tidak ditemukan!`)
        return
      }
    } else {
      // Get first warnet if not specified
      warnet = await Warnet.first()
      if (!warnet) {
        this.logger.error('❌ Tidak ada warnet di database. Silakan buat warnet terlebih dahulu!')
        return
      }
      this.logger.warning(`⚠️  Warnet tidak ditentukan, menggunakan warnet pertama: ${warnet.name} (ID: ${warnet.id})`)
    }

    try {
      // Create operator
      const operator = await User.create({
        username: this.username,
        email: this.email,
        password: this.password, // ✅ Password akan di-hash otomatis
        role: 'operator',
        warnet_id: warnet.id,
        bowar_wallet: 0,
      })

      this.logger.success('✅ Operator berhasil dibuat!')
      this.logger.info(`   Username: ${operator.username}`)
      this.logger.info(`   Email: ${operator.email}`)
      this.logger.info(`   Warnet: ${warnet.name} (ID: ${warnet.id})`)
      this.logger.info(`   Password: ${this.password}`)
      this.logger.warning('   ⚠️  HARAP GANTI PASSWORD SETELAH LOGIN PERTAMA!')
    } catch (error: any) {
      this.logger.error(`❌ Gagal membuat operator: ${error.message}`)
    }
  }
}
