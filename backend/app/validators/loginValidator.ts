import vine from '@vinejs/vine'

export const loginValidator = vine.compile(
  vine.object({
    email: vine.string().email().optional(),
    username: vine.string().minLength(3).optional(),
    password: vine.string().minLength(6),
  })
)
