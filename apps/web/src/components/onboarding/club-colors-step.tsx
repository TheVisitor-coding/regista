import { Check } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { COLOR_PRESETS } from '@regista/shared'
import { cn } from '~/lib/utils'

interface ClubColorsStepProps {
  primaryColor: string
  secondaryColor: string
  onChangePrimary: (color: string) => void
  onChangeSecondary: (color: string) => void
  onNext: () => void
  onBack: () => void
}

function ColorGrid({
  label,
  selected,
  onSelect,
}: {
  label: string
  selected: string
  onSelect: (color: string) => void
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex flex-wrap gap-2">
        {COLOR_PRESETS.map((color) => (
          <button
            key={color}
            onClick={() => onSelect(color)}
            className={cn(
              'relative h-8 w-8 rounded-full border-2 transition-all',
              selected === color
                ? 'border-primary scale-110'
                : 'border-transparent hover:border-muted-foreground/40',
            )}
            style={{ backgroundColor: color }}
          >
            {selected === color && (
              <Check
                className={cn(
                  'absolute inset-0 m-auto h-4 w-4',
                  color === '#FFFFFF' ? 'text-black' : 'text-white',
                )}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

export function ClubColorsStep({
  primaryColor,
  secondaryColor,
  onChangePrimary,
  onChangeSecondary,
  onNext,
  onBack,
}: ClubColorsStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Choose your colors</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick a primary and secondary color for your club.
        </p>
      </div>

      <ColorGrid label="Primary color" selected={primaryColor} onSelect={onChangePrimary} />
      <ColorGrid label="Secondary color" selected={secondaryColor} onSelect={onChangeSecondary} />

      {/* Preview */}
      <div className="flex items-center justify-center gap-4 rounded-lg border border-border p-6">
        <div className="flex h-20 w-16 flex-col overflow-hidden rounded-md border border-border">
          <div className="flex-1" style={{ backgroundColor: primaryColor }} />
          <div className="h-4" style={{ backgroundColor: secondaryColor }} />
        </div>
        <p className="text-sm text-muted-foreground">Kit preview</p>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button onClick={onNext} className="flex-1">
          Continue
        </Button>
      </div>
    </div>
  )
}
