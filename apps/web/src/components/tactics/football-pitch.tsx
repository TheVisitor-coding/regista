import { FORMATION_COORDINATES, FORMATIONS } from '@regista/shared'
import type { LineupSlot } from '~/lib/tactics'
import { cn } from '~/lib/utils'

interface FootballPitchProps {
  formation: string
  startingXI: LineupSlot[]
  onSlotClick?: (index: number) => void
  captainId?: string
  clubColor?: string
}

function compatibilityColor(compat: number | undefined): string {
  if (!compat) return 'border-zinc-500'
  if (compat >= 0.95) return 'border-emerald-500'
  if (compat >= 0.80) return 'border-yellow-500'
  if (compat >= 0.70) return 'border-orange-500'
  return 'border-red-500'
}

function fatigueColor(fatigue: number): string {
  if (fatigue > 80) return 'text-red-400'
  if (fatigue > 60) return 'text-orange-400'
  return 'text-zinc-400'
}

export function FootballPitch({
  formation,
  startingXI,
  onSlotClick,
  captainId,
  clubColor = '#10b981',
}: FootballPitchProps) {
  const coordinates = FORMATION_COORDINATES[formation] ?? FORMATION_COORDINATES['4-4-2']
  const positions = FORMATIONS[formation] ?? FORMATIONS['4-4-2']

  return (
    <div className="relative aspect-[68/105] w-full overflow-hidden rounded-xl bg-gradient-to-b from-emerald-900/80 to-emerald-950/80 border border-emerald-800/40">
      {/* Pitch lines */}
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
        {/* Outer border */}
        <rect x="5" y="3" width="90" height="94" rx="1" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.3" />
        {/* Center line */}
        <line x1="5" y1="50" x2="95" y2="50" stroke="rgba(255,255,255,0.15)" strokeWidth="0.3" />
        {/* Center circle */}
        <circle cx="50" cy="50" r="10" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.3" />
        <circle cx="50" cy="50" r="0.5" fill="rgba(255,255,255,0.2)" />
        {/* Top penalty box */}
        <rect x="25" y="3" width="50" height="14" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.3" />
        <rect x="35" y="3" width="30" height="5" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.3" />
        {/* Bottom penalty box */}
        <rect x="25" y="83" width="50" height="14" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.3" />
        <rect x="35" y="92" width="30" height="5" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.3" />
      </svg>

      {/* Player slots */}
      {coordinates.map((coord, index) => {
        const player = startingXI[index]
        const pos = positions[index]
        const isCaptain = player?.playerId === captainId

        return (
          <button
            key={index}
            className="absolute -translate-x-1/2 -translate-y-1/2 group"
            style={{ left: `${coord.x}%`, top: `${coord.y}%` }}
            onClick={() => onSlotClick?.(index)}
          >
            {player ? (
              <div className="flex flex-col items-center gap-0.5">
                {/* Player circle */}
                <div
                  className={cn(
                    'relative flex h-9 w-9 items-center justify-center rounded-full border-2 text-[10px] font-bold text-white shadow-lg transition-transform group-hover:scale-110',
                    compatibilityColor(player.compatibility),
                  )}
                  style={{ backgroundColor: clubColor }}
                >
                  {player.overall}
                  {isCaptain && (
                    <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 text-[7px] font-bold text-black">
                      C
                    </span>
                  )}
                </div>
                {/* Name */}
                <span className="max-w-16 truncate text-[8px] font-medium text-white/90">
                  {(player.playerName ?? '').split(' ').pop() || '?'}
                </span>
                {/* Fatigue */}
                <span className={cn('text-[7px]', fatigueColor(player.fatigue))}>
                  ⚡{player.fatigue}%
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-0.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-dashed border-white/30 text-[10px] text-white/40 transition-transform group-hover:scale-110 group-hover:border-white/50">
                  +
                </div>
                <span className="text-[8px] text-white/40">{pos}</span>
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}
