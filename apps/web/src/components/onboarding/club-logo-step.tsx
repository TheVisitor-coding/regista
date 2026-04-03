import { Check } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { LOGO_PRESETS } from '@regista/shared'
import { cn } from '~/lib/utils'
import { Shield } from 'lucide-react'

interface ClubLogoStepProps {
  selected: string
  primaryColor: string
  onSelect: (logoId: string) => void
  onNext: () => void
  onBack: () => void
}

export function ClubLogoStep({
  selected,
  primaryColor,
  onSelect,
  onNext,
  onBack,
}: ClubLogoStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Choose your crest</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Select a crest shape for your club.
        </p>
      </div>

      <div className="grid grid-cols-5 gap-3 sm:grid-cols-6">
        {LOGO_PRESETS.map((logoId) => (
          <button
            key={logoId}
            onClick={() => onSelect(logoId)}
            className={cn(
              'flex h-16 w-full items-center justify-center rounded-lg border-2 transition-all',
              selected === logoId
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-muted-foreground/40',
            )}
          >
            <Shield
              className="h-8 w-8"
              style={{ color: primaryColor }}
              fill={selected === logoId ? primaryColor : 'transparent'}
            />
          </button>
        ))}
      </div>

      {selected && (
        <div className="flex items-center justify-center py-4">
          <div className="flex flex-col items-center gap-2">
            <Shield className="h-16 w-16" style={{ color: primaryColor }} fill={primaryColor} />
            <p className="text-xs text-muted-foreground">{selected}</p>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button onClick={onNext} disabled={!selected} className="flex-1">
          Continue
        </Button>
      </div>
    </div>
  )
}
