export const UserStatus = {
  PENDING_VERIFICATION: 'pending_verification',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  BANNED: 'banned',
  DELETED: 'deleted',
} as const

export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus]

export const AuthErrorCode = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  EMAIL_TAKEN: 'EMAIL_TAKEN',
  USERNAME_TAKEN: 'USERNAME_TAKEN',
  ACCOUNT_BANNED: 'ACCOUNT_BANNED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
} as const

export type AuthErrorCode = (typeof AuthErrorCode)[keyof typeof AuthErrorCode]

export interface UserPayload {
  sub: string
  username: string
}

export interface AuthUser {
  id: string
  username: string
  email: string
  status: UserStatus
  hasClub: boolean
  clubId: string | null
  emailVerifiedAt: string | null
  lastLoginAt: string | null
  usernameChangesRemaining: number
  createdAt: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
  passwordConfirmation: string
  acceptedTos: boolean
  isOver13: boolean
}

export interface LoginRequest {
  login: string
  password: string
  rememberMe?: boolean
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  password: string
  passwordConfirmation: string
}

export interface AuthResponse {
  accessToken: string
  user: AuthUser
  needsVerification?: boolean
}

export interface RefreshResponse {
  accessToken: string
}

export interface UserResponse {
  user: AuthUser
}
