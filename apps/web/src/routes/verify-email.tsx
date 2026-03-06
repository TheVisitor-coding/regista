import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { AuthLayout } from '~/components/layout/auth-layout'
import { Button } from '~/components/ui/button'
import { apiClient, ApiRequestError } from '~/lib/api-client'

export const Route = createFileRoute('/verify-email')({
  component: VerifyEmailPage,
  validateSearch: (search: Record<string, unknown>) => ({
    token: (search.token as string) || undefined,
    email: (search.email as string) || undefined,
  }),
})

function VerifyEmailPage() {
  const { token, email } = Route.useSearch()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle')
  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => {
    if (!token) return
    setStatus('verifying')
    apiClient('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    })
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'))
  }, [token])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCooldown])

  const handleResend = async () => {
    if (!email || resendCooldown > 0) return
    try {
      await apiClient('/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email }),
      })
      setResendCooldown(60)
    } catch {}
  }

  if (token) {
    return (
      <AuthLayout title="Email Verification">
        <div className="text-center py-4">
          {status === 'verifying' && (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Verifying your email...</p>
            </div>
          )}
          {status === 'success' && (
            <div className="flex flex-col items-center gap-3">
              <CheckCircle className="h-8 w-8 text-primary" />
              <p>Email verified successfully!</p>
              <Button onClick={() => navigate({ to: '/login' })}>Go to login</Button>
            </div>
          )}
          {status === 'error' && (
            <div className="flex flex-col items-center gap-3">
              <XCircle className="h-8 w-8 text-destructive-foreground" />
              <p>Invalid or expired verification link.</p>
              <Link to="/login" className="text-primary hover:underline">Back to login</Link>
            </div>
          )}
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Check your email" description="We sent a verification link to your email address.">
      <div className="space-y-4 text-center py-4">
        {email && <p className="text-sm text-muted-foreground">Sent to <strong>{email}</strong></p>}
        <Button variant="outline" onClick={handleResend} disabled={resendCooldown > 0}>
          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend verification email'}
        </Button>
        <p className="text-sm text-muted-foreground">
          <Link to="/login" className="text-primary hover:underline">Back to login</Link>
        </p>
      </div>
    </AuthLayout>
  )
}
