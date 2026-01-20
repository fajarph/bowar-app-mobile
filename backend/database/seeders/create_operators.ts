import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'
import Warnet from '#models/warnet'

export default class extends BaseSeeder {
  async run() {
    // Define warnets with complete data
    // Setiap warnet akan dibuat lengkap dengan semua informasi
    const warnetsData = [
      {
        // Data Warnet 1
        name: 'Emperor Cybercafe Warnet Cikarang',
        address: 'Ruko Simprug Garden, Jababeka 2, Cikarang Baru',
        description: 'Premium gaming cafe di Cikarang dengan spesifikasi PC RTX seri terbaru dan lingkungan nyaman ber-AC.',
        regularPricePerHour: 10000,
        memberPricePerHour: 8000,
        totalPCs: 50,
        phone: '0812-1111-2222',
        email: 'info@emperorcybercafe.com',
        operatingHours: '24 Jam',
        latitude: -6.2842,
        longitude: 107.1706,
        image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800',
        bankAccountNumber: '5240333221',
        bankAccountName: 'EMPEROR CYBER CAFE (BCA)',
        operator: {
          username: 'operator_emperor',
          email: 'admin@emperorcybercafe.com',
          password: 'operator123',
        },
      },
      {
        // Data Warnet 2
        name: 'Nexus E-Sports',
        address: 'Mall Taman Anggrek, Lt. 2, Jakarta Barat',
        description: 'Pusat pelatihan E-Sports dengan koneksi fiber optic 1Gbps dan private room.',
        regularPricePerHour: 20000,
        memberPricePerHour: 15000,
        totalPCs: 60,
        phone: '0813-7777-6666',
        email: 'hello@nexusesports.com',
        operatingHours: '10:00 - 24:00',
        latitude: -6.1783,
        longitude: 106.7922,
        image: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=800',
        bankAccountNumber: '5242733211',
        bankAccountName: 'NEXUS ARENA INDONESIA (MANDIRI)',
        operator: {
          username: 'operator_nexus',
          email: 'admin@nexusesports.com',
          password: 'operator123',
        },
      },
      // Tambahkan warnet lain di sini jika perlu
    ]

    console.log('🌱 Membuat warnet dan operator...\n')

    for (const warnetData of warnetsData) {
      // Check if warnet already exists
      const existingWarnet = await Warnet.findBy('name', warnetData.name)
      let warnet = existingWarnet

      if (!existingWarnet) {
        // Create warnet with complete data
        warnet = await Warnet.create({
          name: warnetData.name,
          address: warnetData.address,
          description: warnetData.description,
          regular_price_per_hour: warnetData.regularPricePerHour,
          member_price_per_hour: warnetData.memberPricePerHour,
          total_pcs: warnetData.totalPCs,
          phone: warnetData.phone,
          email: warnetData.email,
          operating_hours: warnetData.operatingHours,
          latitude: warnetData.latitude,
          longitude: warnetData.longitude,
          image: warnetData.image,
          bank_account_number: warnetData.bankAccountNumber,
          bank_account_name: warnetData.bankAccountName,
        })

        console.log(`✅ Warnet berhasil dibuat:`)
        console.log(`   Nama: ${warnet.name}`)
        console.log(`   Alamat: ${warnet.address}`)
        console.log(`   Total PC: ${warnet.total_pcs}`)
        console.log(`   Harga Regular: Rp ${warnet.regular_price_per_hour.toLocaleString()}/jam`)
        console.log(`   Harga Member: Rp ${warnet.member_price_per_hour.toLocaleString()}/jam`)
        console.log(`   Jam Operasional: ${warnet.operating_hours}`)
        console.log(`   ID: ${warnet.id}\n`)
      } else if (warnet) {
        console.log(`⏭️  Warnet "${warnetData.name}" sudah ada (ID: ${warnet.id}), dilewati.\n`)
      }

      // Create operator for this warnet
      if (warnetData.operator && warnet) {
        const existingOperator = await User.findBy('username', warnetData.operator.username)
        if (existingOperator) {
          console.log(`⏭️  Operator "${warnetData.operator.username}" sudah ada, dilewati.\n`)
          continue
        }

        const operator = await User.create({
          username: warnetData.operator.username,
          email: warnetData.operator.email,
          password: warnetData.operator.password, // ✅ Password akan di-hash otomatis
          role: 'operator',
          warnet_id: warnet.id,
          bowar_wallet: 0,
        })

        console.log(`✅ Operator berhasil dibuat:`)
        console.log(`   Username: ${operator.username}`)
        console.log(`   Email: ${operator.email}`)
        console.log(`   Warnet: ${warnet.name} (ID: ${warnet.id})`)
        console.log(
          `   Password: ${warnetData.operator.password} (HARAP GANTI SETELAH LOGIN PERTAMA!)\n`
        )
      }
    }

    console.log('✨ Selesai membuat warnet dan operator!')
  }
}
