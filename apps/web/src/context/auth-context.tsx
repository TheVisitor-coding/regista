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
import { apiClient, setAccessToken } from '~/lib/api-client'

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
    apiClient<RefreshResponse>('/auth/refresh', { method: 'POST' })
      .then((data) => {
        setAccessToken(data.accessToken)
        return apiClient<{ user: AuthUser }>('/users/me')
      })
      .then((data) => setUser(data.user))
      .catch(() => {
        setAccessToken(null)
        setUser(null)
      })
      .finally(() => setIsLoading(false))
  }, [])

  const login = useCallback(async (data: LoginRequest) => {
    const res = await apiClient<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    setAccessToken(res.accessToken)
    setUser(res.user)
    return res
  }, [])

  const register = useCallback(async (data: RegisterRequest) => {
    const res = await apiClient<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    if (res.accessToken) {
      setAccessToken(res.accessToken)
    }
    setUser(res.user)
    return res
  }, [])

  const logout = useCallback(async () => {
    try {
      await apiClient('/auth/logout', { method: 'POST' })
    } finally {
      setAccessToken(null)
      setUser(null)
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
