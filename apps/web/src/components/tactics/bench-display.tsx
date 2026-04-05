import type { LineupSlot } from '~/lib/tactics'
import { Badge } from '~/components/ui/badge'
import { cn } from '~/lib/utils'

interface BenchDisplayProps {
  bench: LineupSlot[]
  onPlayerClick?: (index: number) => void
}

export function BenchDisplay({ bench, onPlayerClick }: BenchDisplayProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Bench ({bench.length}/7)
      </h3>
      <div className="flex flex-wrap gap-2">
        {bench.map((player, index) => (
          <button
            key={player.playerId}
            className="flex items-center gap-2 rounded-lg border border-border bg-background/50 px-3 py-2 text-left transition-colors hover:bg-accent/30"
            onClick={() => onPlayerClick?.(index)}
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-[10px] font-bold">
              {player.overall}
            </div>
            <div>
              <p className="text-xs font-medium">{(player.playerName ?? '').split(' ').pop() || '?'}</p>
              <div className="flex items-center gap-1">
                <Badge variant="outline" className="h-4 px-1 text-[8px]">{player.position}</Badge>
                <span className={cn('text-[9px]', player.fatigue > 70 ? 'text-orange-400' : 'text-muted-foreground')}>
                  ⚡{player.fatigue}%
                </span>
              </div>
            </div>
          </button>
        ))}
        {Array.from({ length: 7 - bench.length }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="flex h-12 w-20 items-center justify-center rounded-lg border border-dashed border-border/50 text-xs text-muted-foreground/30"
          >
            —
          </div>
        ))}
      </div>
    </div>
  )
}
