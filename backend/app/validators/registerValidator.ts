import vine from '@vinejs/vine'

export const registerValidator = vine.compile(
  vine.object({
    username: vine.string().trim().minLength(3).maxLength(30),
    email: vine.string().trim().email(),
    password: vine.string().minLength(6),
    role: vine.enum(['user', 'member', 'operator']).optional()
  })
)
