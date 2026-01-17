import Warnet from '#models/warnet'
import Rule from '#models/rule'
import { HttpContext } from '@adonisjs/core/http'

export default class WarnetController {
  /**
   * GET /warnets - Get all warnets
   * Returns list of all warnets with basic info
   */
  async index({ response }: HttpContext) {
    try {
      const warnets = await Warnet.all()

      return response.ok({
        message: 'List warnet berhasil diambil',
        data: warnets.map((warnet) => ({
          id: warnet.id,
          name: warnet.name,
          location: warnet.address,
          image: warnet.image,
          regularPricePerHour: parseFloat(warnet.regular_price_per_hour.toString()),
          memberPricePerHour: parseFloat(warnet.member_price_per_hour.toString()),
          totalPCs: warnet.total_pcs,
          bankAccountNumber: warnet.bank_account_number,
          bankAccountName: warnet.bank_account_name,
        })),
      })
    } catch (error: any) {
      console.error('Get warnets error:', error)
      return response.internalServerError({
        message: 'Terjadi kesalahan saat mengambil daftar warnet',
      })
    }
  }

  /**
   * GET /warnets/:id - Get warnet detail
   * Returns detailed warnet information including rules
   */
  async show({ params, response }: HttpContext) {
    try {
      const warnet = await Warnet.find(params.id)

      if (!warnet) {
        return response.notFound({
          message: 'Warnet tidak ditemukan',
        })
      }

      // Load rules for this warnet
      const rules = await Rule.query().where('warnet_id', warnet.id)

      // Load PCs for this warnet with current bookings for status
      const pcs = await warnet.related('pcs').query().preload('currentBooking')

      return response.ok({
        message: 'Detail warnet berhasil diambil',
        data: {
          id: warnet.id,
          name: warnet.name,
          location: warnet.address,
          image: warnet.image,
          description: warnet.description,
          regularPricePerHour: parseFloat(warnet.regular_price_per_hour.toString()),
          memberPricePerHour: parseFloat(warnet.member_price_per_hour.toString()),
          totalPCs: warnet.total_pcs,
          phone: warnet.phone,
          email: warnet.email,
          operatingHours: warnet.operating_hours,
          latitude: warnet.latitude ? parseFloat(warnet.latitude.toString()) : null,
          longitude: warnet.longitude ? parseFloat(warnet.longitude.toString()) : null,
          bankAccountNumber: warnet.bank_account_number,
          bankAccountName: warnet.bank_account_name,
          rules: rules.map((rule) => rule.description || rule.value || rule.rule_text || ''),
          pcs: Array.from({ length: warnet.total_pcs }, (_, i) => {
            const pcNumber = i + 1
            const pcRecord = pcs.find((p) => p.pc_number === pcNumber)

            if (pcRecord) {
              const currentBooking = pcRecord.currentBooking
              let remainingMinutes: number | undefined = undefined

              if (pcRecord.status === 'occupied' && currentBooking) {
                remainingMinutes = currentBooking.getRemainingMinutes() || undefined
              }

              return {
                id: pcRecord ? pcRecord.id : `temp-${warnet.id}-${pcNumber}`,
                number: pcNumber,
                status: pcRecord ? pcRecord.status : 'available',
                remainingMinutes,
              }
            }

            // If no record exists, default to available
            return {
              id: `temp-${warnet.id}-${pcNumber}`,
              number: pcNumber,
              status: 'available',
              remainingMinutes: undefined,
            }
          }),
        },
      })
    } catch (error: any) {
      console.error('Get warnet detail error:', error)
      return response.internalServerError({
        message: 'Terjadi kesalahan saat mengambil detail warnet',
      })
    }
  }

  /**
   * GET /warnets/:id/rules - Get rules for specific warnet
   */
  async rules({ params, response }: HttpContext) {
    try {
      const warnet = await Warnet.find(params.id)

      if (!warnet) {
        return response.notFound({
          message: 'Warnet tidak ditemukan',
        })
      }

      const rules = await Rule.query().where('warnet_id', warnet.id)

      return response.ok({
        message: 'Peraturan warnet berhasil diambil',
        data: {
          warnetId: warnet.id,
          warnetName: warnet.name,
          rules: rules.map((rule) => ({
            id: rule.id,
            text: rule.description || rule.value || rule.rule_text || '',
          })),
        },
      })
    } catch (error: any) {
      console.error('Get rules error:', error)
      return response.internalServerError({
        message: 'Terjadi kesalahan saat mengambil peraturan warnet',
      })
    }
  }
}

