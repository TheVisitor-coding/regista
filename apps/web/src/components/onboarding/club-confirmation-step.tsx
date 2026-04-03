import { Shield, Loader2 } from 'lucide-react'
import { Button } from '~/components/ui/button'

interface ClubConfirmationStepProps {
  name: string
  primaryColor: string
  secondaryColor: string
  logoId: string
  isCreating: boolean
  error: string | null
  onCreate: () => void
  onBack: () => void
}

export function ClubConfirmationStep({
  name,
  primaryColor,
  secondaryColor,
  logoId,
  isCreating,
  error,
  onCreate,
  onBack,
}: ClubConfirmationStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Confirm your club</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Review your club details before creating it.
        </p>
      </div>

      <div className="flex flex-col items-center gap-4 rounded-lg border border-border p-8">
        <Shield className="h-20 w-20" style={{ color: primaryColor }} fill={primaryColor} />
        <h3 className="text-xl font-bold">{name}</h3>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-full border border-border" style={{ backgroundColor: primaryColor }} />
            <span className="text-xs text-muted-foreground">Primary</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-full border border-border" style={{ backgroundColor: secondaryColor }} />
            <span className="text-xs text-muted-foreground">Secondary</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          22 players will be generated for your starting squad.
        </p>
      </div>

      {error && (
        <p className="text-center text-sm text-red-500">{error}</p>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} disabled={isCreating} className="flex-1">
          Back
        </Button>
        <Button onClick={onCreate} disabled={isCreating} className="flex-1">
          {isCreating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Setting up your league...
            </>
          ) : (
            'Create my club'
          )}
        </Button>
      </div>

      {isCreating && (
        <p className="text-center text-xs text-muted-foreground animate-pulse">
          Generating 59 opponent clubs and scheduling 38 matchdays... This may take up to a minute.
        </p>
      )}
    </div>
  )
}
