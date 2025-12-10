import Warnet from '#models/warnet'
import { HttpContext } from '@adonisjs/core/http'

export default class WarnetController {
  /**
   * GET /warnets - Get all warnets
   */
  async index({ response }: HttpContext) {
    const warnets = await Warnet.all()
    
    return response.ok({
      message: 'List warnet berhasil diambil',
      data: warnets,
    })
  }

  /**
   * GET /warnets/:id - Get warnet detail
   */
  async show({ params, response }: HttpContext) {
    const warnet = await Warnet.find(params.id)
    
    if (!warnet) {
      return response.notFound({
        message: 'Warnet tidak ditemukan',
      })
    }

    // Load members count
    await warnet.load('members')
    
    return response.ok({
      message: 'Detail warnet berhasil diambil',
      data: warnet,
    })
  }
}

