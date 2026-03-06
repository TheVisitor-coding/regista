import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Separator } from '~/components/ui/separator'
import { apiClient, ApiRequestError } from '~/lib/api-client'
import { updatePasswordSchema } from '~/lib/validators'

interface Session {
  id: string
  isCurrent: boolean
  createdAt: string
  expiresAt: string
}

export function SecuritySection() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [isRevoking, setIsRevoking] = useState(false)

  useEffect(() => {
    apiClient<{ sessions: Session[] }>('/users/me/sessions')
      .then((res) => setSessions(res.sessions))
      .catch(() => {})
  }, [])

  const handleRevokeAll = async () => {
    setIsRevoking(true)
    try {
      await apiClient('/users/me/sessions', { method: 'DELETE' })
      const res = await apiClient<{ sessions: Session[] }>('/users/me/sessions')
      setSessions(res.sessions)
      toast.success('All other sessions revoked')
    } catch {
      toast.error('Failed to revoke sessions')
    } finally {
      setIsRevoking(false)
    }
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Security</h3>

      <PasswordForm />

      <Separator />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Active sessions</p>
            <p className="text-sm text-muted-foreground">
              {sessions.length} session{sessions.length !== 1 ? 's' : ''}
            </p>
          </div>
          {sessions.length > 1 && (
            <Button variant="outline" size="sm" onClick={handleRevokeAll} disabled={isRevoking}>
              {isRevoking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Log out everywhere
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    const result = updatePasswordSchema.safeParse({
      currentPassword,
      newPassword,
      newPasswordConfirmation,
    })
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
      await apiClient('/users/me/password', {
        method: 'PATCH',
        body: JSON.stringify(result.data),
      })
      toast.success('Password updated')
      setCurrentPassword('')
      setNewPassword('')
      setNewPasswordConfirmation('')
    } catch (err) {
      if (err instanceof ApiRequestError) {
        if (err.status === 401) {
          setErrors({ currentPassword: 'Invalid password' })
        } else {
          toast.error(err.message)
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className="font-medium">Change password</p>
      <div className="space-y-1">
        <Label htmlFor="currentPassword">Current password</Label>
        <Input
          id="currentPassword"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
        {errors.currentPassword && <p className="text-sm text-destructive-foreground">{errors.currentPassword}</p>}
      </div>
      <div className="space-y-1">
        <Label htmlFor="newPassword">New password</Label>
        <Input
          id="newPassword"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        {errors.newPassword && <p className="text-sm text-destructive-foreground">{errors.newPassword}</p>}
      </div>
      <div className="space-y-1">
        <Label htmlFor="newPasswordConfirmation">Confirm new password</Label>
        <Input
          id="newPasswordConfirmation"
          type="password"
          value={newPasswordConfirmation}
          onChange={(e) => setNewPasswordConfirmation(e.target.value)}
        />
        {errors.newPasswordConfirmation && (
          <p className="text-sm text-destructive-foreground">{errors.newPasswordConfirmation}</p>
        )}
      </div>
      <Button type="submit" size="sm" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Update password
      </Button>
    </form>
  )
}
