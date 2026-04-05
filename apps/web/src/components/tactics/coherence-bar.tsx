import { cn } from '~/lib/utils'

interface CoherenceBarProps {
  score: number
  warnings?: string[]
}

export function CoherenceBar({ score, warnings = [] }: CoherenceBarProps) {
  const color = score >= 70 ? 'bg-emerald-500' : score >= 40 ? 'bg-amber-500' : 'bg-red-500'
  const label = score >= 70 ? 'Good' : score >= 40 ? 'Average' : 'Low'

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Coherence</span>
        <span className={cn('text-xs font-semibold', score >= 70 ? 'text-emerald-500' : score >= 40 ? 'text-amber-500' : 'text-red-500')}>
          {score}% — {label}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${score}%` }} />
      </div>
      {warnings.length > 0 && (
        <div className="mt-1 space-y-0.5">
          {warnings.map((w, i) => (
            <p key={i} className="text-[10px] text-amber-500">⚠ {w}</p>
          ))}
        </div>
      )}
    </div>
  )
}
