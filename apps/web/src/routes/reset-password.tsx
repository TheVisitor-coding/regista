import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Eye, EyeOff, Check, X } from 'lucide-react'
import { AuthLayout } from '~/components/layout/auth-layout'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { apiClient, ApiRequestError } from '~/lib/api-client'
import { resetPasswordSchema } from '~/lib/validators'

export const Route = createFileRoute('/reset-password')({
  component: ResetPasswordPage,
  validateSearch: (search: Record<string, unknown>) => ({
    token: (search.token as string) || '',
  }),
})

function ResetPasswordPage() {
  const { token } = Route.useSearch()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  if (!token) {
    navigate({ to: '/forgot-password' })
    return null
  }

  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    digit: /[0-9]/.test(password),
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    const result = resetPasswordSchema.safeParse({ token, password, passwordConfirmation })
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
      await apiClient('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify(result.data),
      })
      toast.success('Password reset successfully')
      navigate({ to: '/login' })
    } catch (err) {
      if (err instanceof ApiRequestError) {
        if (err.body.error === 'TOKEN_INVALID') {
          toast.error('Invalid or expired reset link')
        } else {
          toast.error(err.message)
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout title="Reset your password" description="Choose a new password for your account.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
          {password.length > 0 && (
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
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
            autoComplete="new-password"
          />
          {errors.passwordConfirmation && (
            <p className="text-sm text-destructive-foreground">{errors.passwordConfirmation}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Reset password
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          <Link to="/login" className="text-primary hover:underline">Back to login</Link>
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
