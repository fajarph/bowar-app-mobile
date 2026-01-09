import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'
import Warnet from '#models/warnet'

export default class extends BaseSeeder {
  async run() {
    // Define warnets with complete data
    // Setiap warnet akan dibuat lengkap dengan semua informasi
    const warnetsData = [
      {
        // Data Warnet
        name: 'Warnet Salsa',
        address: 'Jl. Sudirman No. 123, Jakarta Pusat',
        description: 'Warnet modern dengan PC gaming high-end dan koneksi internet super cepat',
        regularPricePerHour: 8000,
        memberPricePerHour: 6000,
        totalPCs: 30,
        phone: '021-12345678',
        email: 'info@salsawarnet.com',
        operatingHours: '24/7',
        latitude: -6.2088,
        longitude: 106.8456,
        image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800', // URL gambar warnet
        bankAccountNumber: '1234567890',
        bankAccountName: 'Warnet Salsa',
        // Data Operator untuk warnet ini
        operator: {
          username: 'operator_salsa',
          email: 'operator@salsawarnet.com',
          password: 'operator123',
        },
      },
      {
        name: 'Warnet Cyber Zone',
        address: 'Jl. Thamrin No. 456, Jakarta Selatan',
        description: 'Warnet gaming dengan spesifikasi PC terbaik dan ruangan ber-AC',
        regularPricePerHour: 10000,
        memberPricePerHour: 7500,
        totalPCs: 50,
        phone: '021-87654321',
        email: 'info@cyberzone.com',
        operatingHours: '08:00-24:00',
        latitude: -6.2297,
        longitude: 106.7997,
        image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800',
        bankAccountNumber: '0987654321',
        bankAccountName: 'Cyber Zone Warnet',
        operator: {
          username: 'operator_cyberzone',
          email: 'operator@cyberzone.com',
          password: 'operator123',
        },
      },
      {
        name: 'Warnet Game Center',
        address: 'Jl. Gatot Subroto No. 789, Jakarta Barat',
        description: 'Tempat gaming favorit dengan PC gaming RTX dan headset premium',
        regularPricePerHour: 12000,
        memberPricePerHour: 9000,
        totalPCs: 40,
        phone: '021-11223344',
        email: 'info@gamecenter.com',
        operatingHours: '24/7',
        latitude: -6.1944,
        longitude: 106.8229,
        image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800',
        bankAccountNumber: '1122334455',
        bankAccountName: 'Game Center Warnet',
        operator: {
          username: 'operator_gamecenter',
          email: 'operator@gamecenter.com',
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
