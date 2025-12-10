import User from '#models/user'
import Warnet from '#models/warnet'
import hash from '@adonisjs/core/services/hash'
import { HttpContext } from '@adonisjs/core/http'

export default class RegisterController {
  /**
   * REGISTER USER BIASA
   */
  async registerUser({ request, response }: HttpContext) {
    const data = request.only(['username', 'email', 'password'])

    const hashedPassword = await hash.make(data.password)

    const user = await User.create({
      username: data.username,
      email: data.email,
      password: hashedPassword,
      role: 'user',
    })

    return response.created({
      message: 'User berhasil terdaftar',
      user,
    })
  }

  /**
   * REGISTER MEMBER (WAJIB PILIH WARNET)
   */
  async registerMember({ request, response }: HttpContext) {
    const data = request.only(['username', 'email', 'password', 'warnet_id'])

    if (!data.warnet_id) {
      return response.badRequest({
        message: 'Member wajib memilih warnet',
      })
    }

    const warnet = await Warnet.find(data.warnet_id)
    if (!warnet) {
      return response.badRequest({
        message: 'Warnet tidak ditemukan',
      })
    }

    const hashedPassword = await hash.make(data.password)

    const user = await User.create({
      username: data.username,
      email: data.email,
      password: hashedPassword,
      role: 'member',
      warnet_id: data.warnet_id,
    })

    return response.created({
      message: 'Member berhasil terdaftar',
      user,
    })
  }

  /**
   * REGISTER OPERATOR
   * (DIREKOMENDASIKAN UNTUK ADMIN SAJA)
   */
  async registerOperator({ request, response }: HttpContext) {
    const data = request.only(['username', 'email', 'password', 'warnet_id'])

    const warnet = await Warnet.find(data.warnet_id)
    if (!warnet) {
      return response.badRequest({
        message: 'Warnet tidak ditemukan',
      })
    }

    const hashedPassword = await hash.make(data.password)

    const user = await User.create({
      username: data.username,
      email: data.email,
      password: hashedPassword,
      role: 'operator',
      warnet_id: data.warnet_id,
    })

    return response.created({
      message: 'Operator berhasil dibuat',
      user,
    })
  }

  /**
   * PROFILE
   */
  async profile({ auth }: HttpContext) {
    await auth.check()
    return { user: auth.user }
  }
}
