import vine from '@vinejs/vine'
import {
  USERNAME_MIN,
  USERNAME_MAX,
  PASSWORD_MIN,
  PASSWORD_MAX,
} from '@regista/shared'

export const updateUsernameValidator = vine.compile(
  vine.object({
    username: vine
      .string()
      .trim()
      .minLength(USERNAME_MIN)
      .maxLength(USERNAME_MAX)
      .regex(/^[a-zA-Z0-9_-]+$/),
    password: vine.string().minLength(1),
  }),
)

export const updateEmailValidator = vine.compile(
  vine.object({
    email: vine.string().trim().email().maxLength(255),
    password: vine.string().minLength(1),
  }),
)

export const updatePasswordValidator = vine.compile(
  vine.object({
    currentPassword: vine.string().minLength(1),
    newPassword: vine
      .string()
      .minLength(PASSWORD_MIN)
      .maxLength(PASSWORD_MAX)
      .regex(/[A-Z]/)
      .regex(/[a-z]/)
      .regex(/[0-9]/),
    newPasswordConfirmation: vine.string(),
  }),
)

export const deleteAccountValidator = vine.compile(
  vine.object({
    password: vine.string().minLength(1),
    confirmation: vine.string().in(['SUPPRIMER']),
  }),
)
