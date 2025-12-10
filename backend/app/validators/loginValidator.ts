import vine from '@vinejs/vine'

export const loginValidator = vine.compile(
  vine.object({
    // Username or email (at least one must be provided)
    username: vine.string().minLength(3).optional(),
    email: vine.string().email().optional(),
    password: vine.string().minLength(6),
    role: vine.enum(['user', 'member', 'operator']).optional(),
  })
)
