import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Separator } from '~/components/ui/separator'
import { useAuth } from '~/hooks/use-auth'
import { apiClient, ApiRequestError } from '~/lib/api-client'
import { updateUsernameSchema, updateEmailSchema } from '~/lib/validators'
import type { UserResponse } from '@regista/shared'

export function ProfileSection() {
  const { user, setUser } = useAuth()
  const [editingUsername, setEditingUsername] = useState(false)
  const [editingEmail, setEditingEmail] = useState(false)

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Profile</h3>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Username</p>
            <p className="font-medium">{user?.username}</p>
            <p className="text-xs text-muted-foreground">
              {user?.usernameChangesRemaining} change{user?.usernameChangesRemaining !== 1 ? 's' : ''} remaining
            </p>
          </div>
          {!editingUsername && (user?.usernameChangesRemaining ?? 0) > 0 && (
            <Button variant="outline" size="sm" onClick={() => setEditingUsername(true)}>
              Edit
            </Button>
          )}
        </div>

        {editingUsername && (
          <UsernameForm
            onDone={(updated) => {
              if (updated) setUser(updated)
              setEditingUsername(false)
            }}
          />
        )}

        <Separator />

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{user?.email}</p>
          </div>
          {!editingEmail && (
            <Button variant="outline" size="sm" onClick={() => setEditingEmail(true)}>
              Edit
            </Button>
          )}
        </div>

        {editingEmail && (
          <EmailForm
            onDone={(updated) => {
              if (updated) setUser(updated)
              setEditingEmail(false)
            }}
          />
        )}
      </div>
    </div>
  )
}

function UsernameForm({ onDone }: { onDone: (user?: import('@regista/shared').AuthUser) => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    const result = updateUsernameSchema.safeParse({ username, password })
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0] as string] = issue.message
      })
      setErrors(fieldErrors)
      return
    }

    setIsLoading(true)
    try {
      const res = await apiClient<UserResponse>('/users/me/username', {
        method: 'PATCH',
        body: JSON.stringify(result.data),
      })
      toast.success('Username updated')
      onDone(res.user)
    } catch (err) {
      if (err instanceof ApiRequestError) {
        if (err.body.errors) {
          const fieldErrors: Record<string, string> = {}
          err.body.errors.forEach((e) => { fieldErrors[e.field] = e.message })
          setErrors(fieldErrors)
        } else {
          toast.error(err.message)
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-md border border-border p-4">
      <div className="space-y-1">
        <Label htmlFor="newUsername">New username</Label>
        <Input id="newUsername" value={username} onChange={(e) => setUsername(e.target.value)} />
        {errors.username && <p className="text-sm text-destructive-foreground">{errors.username}</p>}
      </div>
      <div className="space-y-1">
        <Label htmlFor="usernamePassword">Password</Label>
        <Input id="usernamePassword" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {errors.password && <p className="text-sm text-destructive-foreground">{errors.password}</p>}
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => onDone()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

function EmailForm({ onDone }: { onDone: (user?: import('@regista/shared').AuthUser) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    const result = updateEmailSchema.safeParse({ email, password })
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0] as string] = issue.message
      })
      setErrors(fieldErrors)
      return
    }

    setIsLoading(true)
    try {
      const res = await apiClient<UserResponse>('/users/me/email', {
        method: 'PATCH',
        body: JSON.stringify(result.data),
      })
      toast.success('Email updated')
      onDone(res.user)
    } catch (err) {
      if (err instanceof ApiRequestError) {
        if (err.body.errors) {
          const fieldErrors: Record<string, string> = {}
          err.body.errors.forEach((e) => { fieldErrors[e.field] = e.message })
          setErrors(fieldErrors)
        } else {
          toast.error(err.message)
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-md border border-border p-4">
      <div className="space-y-1">
        <Label htmlFor="newEmail">New email</Label>
        <Input id="newEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        {errors.email && <p className="text-sm text-destructive-foreground">{errors.email}</p>}
      </div>
      <div className="space-y-1">
        <Label htmlFor="emailPassword">Password</Label>
        <Input id="emailPassword" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {errors.password && <p className="text-sm text-destructive-foreground">{errors.password}</p>}
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => onDone()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
