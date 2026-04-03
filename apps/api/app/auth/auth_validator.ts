import vine from '@vinejs/vine'
import {
  USERNAME_MIN,
  USERNAME_MAX,
  PASSWORD_MIN,
  PASSWORD_MAX,
} from '@regista/shared'

const passwordRules = vine
  .string()
  .minLength(PASSWORD_MIN)
  .maxLength(PASSWORD_MAX)
  .regex(/[A-Z]/)
  .regex(/[a-z]/)
  .regex(/[0-9]/)

export const registerValidator = vine.compile(
  vine.object({
    username: vine
      .string()
      .trim()
      .minLength(USERNAME_MIN)
      .maxLength(USERNAME_MAX)
      .regex(/^[a-zA-Z0-9_-]+$/),
    email: vine.string().trim().email().maxLength(255),
    password: passwordRules.clone(),
    passwordConfirmation: vine.string(),
    acceptedTos: vine.literal(true),
    isOver13: vine.literal(true),
  }),
)

export const loginValidator = vine.compile(
  vine.object({
    login: vine.string().trim().minLength(1),
    password: vine.string().minLength(1),
    rememberMe: vine.boolean().optional(),
  }),
)

export const verifyEmailValidator = vine.compile(
  vine.object({
    token: vine.string().trim().uuid(),
  }),
)

export const resendVerificationValidator = vine.compile(
  vine.object({
    email: vine.string().trim().email(),
  }),
)

export const forgotPasswordValidator = vine.compile(
  vine.object({
    email: vine.string().trim().email(),
  }),
)

export const resetPasswordValidator = vine.compile(
  vine.object({
    token: vine.string().trim().uuid(),
    password: passwordRules.clone(),
    passwordConfirmation: vine.string(),
  }),
)
