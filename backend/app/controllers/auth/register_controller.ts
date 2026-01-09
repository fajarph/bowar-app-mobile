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
    try {
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

      // Username must be unique
      if (await User.findBy('username', data.username)) {
        return response.badRequest({ message: 'Username sudah digunakan' })
      }

      // Check if email + warnet_id combination already exists
      // Allow same email for different warnets, but not same email + warnet_id
      const existingMember = await User.query()
        .where('email', data.email)
        .where('warnet_id', payload.warnet_id)
        .where('role', 'member')
        .first()
      
      if (existingMember) {
        return response.badRequest({
          message: 'Email ini sudah terdaftar sebagai member di warnet ini. Gunakan username yang berbeda untuk warnet lain.',
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
    } catch (error: any) {
      if (error.code === 'E_VALIDATION_FAILURE') throw error

      // Handle database unique constraint errors
      if (error.code === '23505') { // PostgreSQL unique violation
        if (error.constraint === 'users_email_unique') {
          return response.badRequest({
            message: 'Email ini sudah terdaftar. Silakan jalankan migration untuk menghapus unique constraint pada email.',
          })
        }
        if (error.constraint === 'users_username_unique') {
          return response.badRequest({ message: 'Username sudah digunakan' })
        }
      }

      console.error('Registration error:', error)
      return response.internalServerError({
        message: 'Terjadi kesalahan saat mendaftar member',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      })
    }
  }

  /**
   * REGISTER OPERATOR
   */
  async registerOperator({ request, response }: HttpContext) {
    try {
      const payload = request.only(['username', 'email', 'password', 'warnet_id'])

      // Validate using registerValidator
      const data = await request.validateUsing(registerValidator, {
        data: {
          username: payload.username,
          email: payload.email,
          password: payload.password,
        },
      })

      if (!payload.warnet_id) {
        return response.badRequest({ message: 'Warnet wajib dipilih' })
      }

      const warnet = await Warnet.find(payload.warnet_id)
      if (!warnet) {
        return response.badRequest({ message: 'Warnet tidak ditemukan' })
      }

      // Check if username already exists
      if (await User.findBy('username', data.username)) {
        return response.badRequest({ message: 'Username sudah digunakan' })
      }

      // Check if email already exists
      if (await User.findBy('email', data.email)) {
        return response.badRequest({ message: 'Email sudah digunakan' })
      }

      const user = await User.create({
        username: data.username,
        email: data.email,
        password: data.password, // ✅ RAW PASSWORD (will be hashed by model)
        role: 'operator',
        warnet_id: payload.warnet_id,
      })

      await user.load('warnet')

      return response.created({
        message: 'Operator berhasil dibuat',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          warnet: user.warnet ? {
            id: user.warnet.id,
            name: user.warnet.name,
            address: user.warnet.address,
          } : null,
        },
      })
    } catch (error: any) {
      if (error.code === 'E_VALIDATION_FAILURE') throw error

      return response.internalServerError({
        message: 'Terjadi kesalahan saat mendaftar operator',
      })
    }
  }
}
