import vine from '@vinejs/vine'

export const loginValidator = vine.compile(
  vine.object({
    username: vine.string().minLength(3), // email ATAU username
    password: vine.string().minLength(6),
  })
)
