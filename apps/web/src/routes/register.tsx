import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Check, X, Loader2, Eye, EyeOff } from 'lucide-react'
import { AuthLayout } from '~/components/layout/auth-layout'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Checkbox } from '~/components/ui/checkbox'
import { useAuth } from '~/hooks/use-auth'
import { useDebounce } from '~/hooks/use-debounce'
import { registerSchema, type RegisterForm } from '~/lib/validators'
import { apiClient, ApiRequestError } from '~/lib/api-client'
import type { AvailabilityCheck } from '@regista/shared'

export const Route = createFileRoute('/register')({
  component: RegisterPage,
})

function RegisterPage() {
  const { register, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [form, setForm] = useState<RegisterForm>({
    username: '',
    email: '',
    password: '',
    passwordConfirmation: '',
    acceptedTos: false as unknown as true,
    isOver13: false as unknown as true,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [usernameCheck, setUsernameCheck] = useState<{ status: 'idle' | 'checking' | 'available' | 'taken'; reason?: string }>({ status: 'idle' })
  const [emailCheck, setEmailCheck] = useState<{ status: 'idle' | 'checking' | 'available' | 'taken' }>({ status: 'idle' })

  const debouncedUsername = useDebounce(form.username, 300)
  const debouncedEmail = useDebounce(form.email, 300)

  if (isAuthenticated) {
    navigate({ to: '/dashboard' })
    return null
  }

  useEffect(() => {
    if (!debouncedUsername || debouncedUsername.length < 3) {
      setUsernameCheck({ status: 'idle' })
      return
    }
    setUsernameCheck({ status: 'checking' })
    apiClient<AvailabilityCheck>(`/auth/check-username?q=${encodeURIComponent(debouncedUsername)}`)
      .then((res) => setUsernameCheck({ status: res.available ? 'available' : 'taken', reason: res.reason }))
      .catch(() => setUsernameCheck({ status: 'idle' }))
  }, [debouncedUsername])

  useEffect(() => {
    if (!debouncedEmail || !debouncedEmail.includes('@')) {
      setEmailCheck({ status: 'idle' })
      return
    }
    setEmailCheck({ status: 'checking' })
    apiClient<AvailabilityCheck>(`/auth/check-email?q=${encodeURIComponent(debouncedEmail)}`)
      .then((res) => setEmailCheck({ status: res.available ? 'available' : 'taken' }))
      .catch(() => setEmailCheck({ status: 'idle' }))
  }, [debouncedEmail])

  const passwordChecks = {
    length: form.password.length >= 8,
    uppercase: /[A-Z]/.test(form.password),
    digit: /[0-9]/.test(form.password),
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    const result = registerSchema.safeParse(form)
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as string
        if (!fieldErrors[field]) fieldErrors[field] = issue.message
      })
      setErrors(fieldErrors)
      return
    }

    setIsLoading(true)
    try {
      await register(result.data)
      navigate({ to: '/verify-email', search: { email: form.email, token: undefined } })
    } catch (err) {
      if (err instanceof ApiRequestError) {
        if (err.status === 409 && err.body.errors) {
          const fieldErrors: Record<string, string> = {}
          err.body.errors.forEach((e) => {
            fieldErrors[e.field] = e.message
          })
          setErrors(fieldErrors)
        } else if (err.status === 429) {
          toast.error('Too many attempts. Please try again later.')
        } else {
          toast.error(err.message)
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  function AvailabilityIcon({ status }: { status: 'idle' | 'checking' | 'available' | 'taken' }) {
    if (status === 'checking') return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
    if (status === 'available') return <Check className="h-4 w-4 text-primary" />
    if (status === 'taken') return <X className="h-4 w-4 text-destructive-foreground" />
    return null
  }

  return (
    <AuthLayout title="Create your account" description="Join Regista and manage your club">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <div className="relative">
            <Input
              id="username"
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              placeholder="manager_name"
              autoComplete="username"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <AvailabilityIcon status={usernameCheck.status} />
            </div>
          </div>
          {usernameCheck.status === 'taken' && (
            <p className="text-sm text-destructive-foreground">{usernameCheck.reason || 'Username is taken'}</p>
          )}
          {errors.username && <p className="text-sm text-destructive-foreground">{errors.username}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="your@email.com"
              autoComplete="email"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <AvailabilityIcon status={emailCheck.status} />
            </div>
          </div>
          {emailCheck.status === 'taken' && (
            <p className="text-sm text-destructive-foreground">Email is already taken</p>
          )}
          {errors.email && <p className="text-sm text-destructive-foreground">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {form.password.length > 0 && (
            <div className="space-y-1 text-xs">
              <PasswordCheck ok={passwordChecks.length}>At least 8 characters</PasswordCheck>
              <PasswordCheck ok={passwordChecks.uppercase}>One uppercase letter</PasswordCheck>
              <PasswordCheck ok={passwordChecks.digit}>One digit</PasswordCheck>
            </div>
          )}
          {errors.password && <p className="text-sm text-destructive-foreground">{errors.password}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="passwordConfirmation">Confirm password</Label>
          <Input
            id="passwordConfirmation"
            type="password"
            value={form.passwordConfirmation}
            onChange={(e) => setForm((f) => ({ ...f, passwordConfirmation: e.target.value }))}
            autoComplete="new-password"
          />
          {errors.passwordConfirmation && (
            <p className="text-sm text-destructive-foreground">{errors.passwordConfirmation}</p>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="acceptedTos"
              checked={form.acceptedTos}
              onCheckedChange={(checked) =>
                setForm((f) => ({ ...f, acceptedTos: checked === true } as RegisterForm))
              }
            />
            <Label htmlFor="acceptedTos" className="text-sm font-normal">
              I accept the terms of service
            </Label>
          </div>
          {errors.acceptedTos && <p className="text-sm text-destructive-foreground">{errors.acceptedTos}</p>}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isOver13"
              checked={form.isOver13}
              onCheckedChange={(checked) =>
                setForm((f) => ({ ...f, isOver13: checked === true } as RegisterForm))
              }
            />
            <Label htmlFor="isOver13" className="text-sm font-normal">
              I am 13 years or older
            </Label>
          </div>
          {errors.isOver13 && <p className="text-sm text-destructive-foreground">{errors.isOver13}</p>}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create account
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}

function PasswordCheck({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      {ok ? <Check className="h-3 w-3 text-primary" /> : <X className="h-3 w-3 text-muted-foreground" />}
      <span className={ok ? 'text-primary' : 'text-muted-foreground'}>{children}</span>
    </div>
  )
}
