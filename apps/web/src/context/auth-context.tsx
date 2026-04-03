import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type {
  AuthResponse,
  AuthUser,
  LoginRequest,
  RegisterRequest,
  RefreshResponse,
} from '@regista/shared'
import { apiClient, getAccessToken, setAccessToken } from '~/lib/api-client'

const AUTH_USER_STORAGE_KEY = 'regista:auth:user'

function isBrowser() {
  return typeof window !== 'undefined'
}

function readStoredUser(): AuthUser | null {
  if (!isBrowser()) return null

  const raw = window.localStorage.getItem(AUTH_USER_STORAGE_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    window.localStorage.removeItem(AUTH_USER_STORAGE_KEY)
    return null
  }
}

function writeStoredUser(user: AuthUser | null) {
  if (!isBrowser()) return

  if (user) {
    window.localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user))
  } else {
    window.localStorage.removeItem(AUTH_USER_STORAGE_KEY)
  }
}

export interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (data: LoginRequest) => Promise<AuthResponse>
  register: (data: RegisterRequest) => Promise<AuthResponse>
  logout: () => Promise<void>
  setUser: (user: AuthUser | null) => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedUser = readStoredUser()
    if (storedUser) {
      setUser(storedUser)
    }

    async function bootstrapAuth() {
      try {
        if (!getAccessToken()) {
          const refresh = await apiClient<RefreshResponse>('/auth/refresh', { method: 'POST' })
          setAccessToken(refresh.accessToken)
        }

        const data = await apiClient<{ user: AuthUser }>('/users/me')
        setUser(data.user)
        writeStoredUser(data.user)
      } catch {
        setAccessToken(null)
        setUser(null)
        writeStoredUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    bootstrapAuth()
  }, [])

  const login = useCallback(async (data: LoginRequest) => {
    const res = await apiClient<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    })

    if (res.accessToken) {
      setAccessToken(res.accessToken)
      setUser(res.user)
      writeStoredUser(res.user)
    } else {
      setAccessToken(null)
      setUser(null)
      writeStoredUser(null)
    }

    return res
  }, [])

  const register = useCallback(async (data: RegisterRequest) => {
    const res = await apiClient<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })

    if (res.accessToken) {
      setAccessToken(res.accessToken)
      setUser(res.user)
      writeStoredUser(res.user)
    } else {
      setAccessToken(null)
      setUser(null)
      writeStoredUser(null)
    }

    return res
  }, [])

  const logout = useCallback(async () => {
    try {
      await apiClient('/auth/logout', { method: 'POST' })
    } finally {
      setAccessToken(null)
      setUser(null)
      writeStoredUser(null)
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      logout,
      setUser,
    }),
    [user, isLoading, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
