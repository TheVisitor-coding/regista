import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'
import { useAuth } from '~/hooks/use-auth'
import { apiClient, ApiRequestError, setAccessToken } from '~/lib/api-client'
import { deleteAccountSchema } from '~/lib/validators'

export function DangerSection() {
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-destructive-foreground">Danger Zone</h3>
      <p className="text-sm text-muted-foreground">
        Permanently delete your account and all associated data.
      </p>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="destructive">Delete my account</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>
              This action is irreversible. All your data will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DeleteForm onDone={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function DeleteForm({ onDone }: { onDone: () => void }) {
  const { setUser } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    const result = deleteAccountSchema.safeParse({ password, confirmation })
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
      await apiClient('/users/me', {
        method: 'DELETE',
        body: JSON.stringify(result.data),
      })
      setAccessToken(null)
      setUser(null)
      onDone()
      toast.success('Account deleted')
      navigate({ to: '/' })
    } catch (err) {
      if (err instanceof ApiRequestError) {
        if (err.status === 401) {
          setErrors({ password: 'Invalid password' })
        } else {
          toast.error(err.message)
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="deletePassword">Password</Label>
        <Input
          id="deletePassword"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {errors.password && <p className="text-sm text-destructive-foreground">{errors.password}</p>}
      </div>
      <div className="space-y-1">
        <Label htmlFor="deleteConfirmation">Type SUPPRIMER to confirm</Label>
        <Input
          id="deleteConfirmation"
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          placeholder="SUPPRIMER"
        />
        {errors.confirmation && <p className="text-sm text-destructive-foreground">{errors.confirmation}</p>}
      </div>
      <Button type="submit" variant="destructive" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Delete my account permanently
      </Button>
    </form>
  )
}
