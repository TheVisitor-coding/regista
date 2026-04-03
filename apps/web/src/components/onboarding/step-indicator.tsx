import { cn } from '~/lib/utils'

interface StepIndicatorProps {
  currentStep: number
  totalSteps: number
}

export function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: totalSteps }, (_, i) => (
        <div
          key={i}
          className={cn(
            'h-2 flex-1 rounded-full transition-colors',
            i < currentStep ? 'bg-primary' : 'bg-muted',
          )}
        />
      ))}
    </div>
  )
}
