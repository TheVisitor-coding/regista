import { useCallback, useEffect, useState } from 'react'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Button } from '~/components/ui/button'
import { checkClubName } from '~/lib/club'
import { CLUB_NAME_MIN, CLUB_NAME_MAX } from '@regista/shared'

interface ClubNameStepProps {
  value: string
  onChange: (name: string) => void
  onNext: () => void
}

export function ClubNameStep({ value, onChange, onNext }: ClubNameStepProps) {
  const [checking, setChecking] = useState(false)
  const [available, setAvailable] = useState<boolean | null>(null)
  const [reason, setReason] = useState<string | undefined>()

  const checkAvailability = useCallback(async (name: string) => {
    if (name.length < CLUB_NAME_MIN) {
      setAvailable(null)
      return
    }
    setChecking(true)
    try {
      const result = await checkClubName(name)
      setAvailable(result.available)
      setReason(result.reason)
    } catch {
      setAvailable(null)
    } finally {
      setChecking(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (value.length >= CLUB_NAME_MIN) {
        checkAvailability(value)
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [value, checkAvailability])

  const isValid = value.length >= CLUB_NAME_MIN && value.length <= CLUB_NAME_MAX && available === true

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Name your club</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose a unique name for your football club.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="club-name">Club name</Label>
        <Input
          id="club-name"
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            setAvailable(null)
          }}
          placeholder="e.g. FC Barcelona, AS Monaco..."
          maxLength={CLUB_NAME_MAX}
          autoFocus
        />
        <div className="h-5 text-sm">
          {checking && <span className="text-muted-foreground">Checking availability...</span>}
          {!checking && available === true && (
            <span className="text-emerald-500">Name is available</span>
          )}
          {!checking && available === false && (
            <span className="text-red-500">{reason || 'Name is not available'}</span>
          )}
          {!checking && value.length > 0 && value.length < CLUB_NAME_MIN && (
            <span className="text-muted-foreground">
              At least {CLUB_NAME_MIN} characters required
            </span>
          )}
        </div>
      </div>

      <Button onClick={onNext} disabled={!isValid} className="w-full">
        Continue
      </Button>
    </div>
  )
}
