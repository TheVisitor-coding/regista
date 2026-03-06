import { z } from 'zod'
import {
  USERNAME_MIN,
  USERNAME_MAX,
  PASSWORD_MIN,
  PASSWORD_MAX,
} from '@regista/shared'

export const loginSchema = z.object({
  login: z.string().min(1, 'Required'),
  password: z.string().min(1, 'Required'),
  rememberMe: z.boolean().optional(),
})

export type LoginForm = z.infer<typeof loginSchema>

const passwordSchema = z
  .string()
  .min(PASSWORD_MIN, `At least ${PASSWORD_MIN} characters`)
  .max(PASSWORD_MAX, `At most ${PASSWORD_MAX} characters`)
  .regex(/[A-Z]/, 'Must contain an uppercase letter')
  .regex(/[a-z]/, 'Must contain a lowercase letter')
  .regex(/[0-9]/, 'Must contain a digit')

export const registerSchema = z
  .object({
    username: z
      .string()
      .min(USERNAME_MIN, `At least ${USERNAME_MIN} characters`)
      .max(USERNAME_MAX, `At most ${USERNAME_MAX} characters`)
      .regex(/^[a-zA-Z0-9_-]+$/, 'Only letters, numbers, _ and -'),
    email: z.string().email('Invalid email'),
    password: passwordSchema,
    passwordConfirmation: z.string(),
    acceptedTos: z.literal(true, { errorMap: () => ({ message: 'Required' }) }),
    isOver13: z.literal(true, { errorMap: () => ({ message: 'Required' }) }),
  })
  .refine((d) => d.password === d.passwordConfirmation, {
    message: 'Passwords do not match',
    path: ['passwordConfirmation'],
  })

export type RegisterForm = z.infer<typeof registerSchema>

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email'),
})

export type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>

export const resetPasswordSchema = z
  .object({
    token: z.string(),
    password: passwordSchema,
    passwordConfirmation: z.string(),
  })
  .refine((d) => d.password === d.passwordConfirmation, {
    message: 'Passwords do not match',
    path: ['passwordConfirmation'],
  })

export type ResetPasswordForm = z.infer<typeof resetPasswordSchema>

export const updateUsernameSchema = z.object({
  username: z
    .string()
    .min(USERNAME_MIN, `At least ${USERNAME_MIN} characters`)
    .max(USERNAME_MAX, `At most ${USERNAME_MAX} characters`)
    .regex(/^[a-zA-Z0-9_-]+$/, 'Only letters, numbers, _ and -'),
  password: z.string().min(1, 'Required'),
})

export const updateEmailSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Required'),
})

export const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Required'),
    newPassword: passwordSchema,
    newPasswordConfirmation: z.string(),
  })
  .refine((d) => d.newPassword === d.newPasswordConfirmation, {
    message: 'Passwords do not match',
    path: ['newPasswordConfirmation'],
  })

export const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Required'),
  confirmation: z.literal('SUPPRIMER', { errorMap: () => ({ message: 'Type SUPPRIMER' }) }),
})
