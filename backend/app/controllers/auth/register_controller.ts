import User from '#models/user'
import Warnet from '#models/warnet'
import { HttpContext } from '@adonisjs/core/http'
import { registerValidator } from '#validators/registerValidator'

export default class RegisterController {
  /**
   * REGISTER USER BIASA
   */
  async registerUser({ request, response }: HttpContext) {
    try {
      const data = await request.validateUsing(registerValidator)

      // Username unique
      if (await User.findBy('username', data.username)) {
        return response.badRequest({ message: 'Username sudah digunakan' })
      }

      // Email unique
      if (await User.findBy('email', data.email)) {
        return response.badRequest({ message: 'Email sudah digunakan' })
      }

      const user = await User.create({
        username: data.username,
        email: data.email,
        password: data.password, // ✅ RAW PASSWORD
        role: 'user',
      })

      return response.created({
        message: 'User berhasil terdaftar',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      })
    } catch (error: any) {
      if (error.code === 'E_VALIDATION_FAILURE') throw error

      return response.internalServerError({
        message: 'Terjadi kesalahan saat mendaftar',
      })
    }
  }

  /**
   * REGISTER MEMBER
   */
  async registerMember({ request, response }: HttpContext) {
    const payload = request.only(['username', 'email', 'password', 'warnet_id'])

    const data = await request.validateUsing(registerValidator, {
      data: {
        username: payload.username,
        email: payload.email,
        password: payload.password,
      },
    })

    if (!payload.warnet_id) {
      return response.badRequest({ message: 'Member wajib memilih warnet' })
    }

    const warnet = await Warnet.find(payload.warnet_id)
    if (!warnet) {
      return response.badRequest({ message: 'Warnet tidak ditemukan' })
    }

    if (await User.findBy('username', data.username)) {
      return response.badRequest({ message: 'Username sudah digunakan' })
    }

    const existingEmail = await User.findBy('email', data.email)
    if (existingEmail && existingEmail.warnet_id === payload.warnet_id) {
      return response.badRequest({
        message: 'Email ini sudah terdaftar di warnet ini',
      })
    }

    const user = await User.create({
      username: data.username,
      email: data.email,
      password: data.password, // ✅ RAW PASSWORD
      role: 'member',
      warnet_id: payload.warnet_id,
    })

    await user.load('warnet')

    return response.created({
      message: 'Member berhasil terdaftar',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        warnet: {
          id: user.warnet.id,
          name: user.warnet.name,
          address: user.warnet.address,
        },
      },
    })
  }

  /**
   * REGISTER OPERATOR
   */
  async registerOperator({ request, response }: HttpContext) {
    const data = request.only(['username', 'email', 'password', 'warnet_id'])

    const warnet = await Warnet.find(data.warnet_id)
    if (!warnet) {
      return response.badRequest({ message: 'Warnet tidak ditemukan' })
    }

    const user = await User.create({
      username: data.username,
      email: data.email,
      password: data.password, // ✅ RAW PASSWORD
      role: 'operator',
      warnet_id: data.warnet_id,
    })

    return response.created({
      message: 'Operator berhasil dibuat',
      user,
    })
  }
}
