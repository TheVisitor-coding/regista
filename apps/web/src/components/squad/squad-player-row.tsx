import { useNavigate } from '@tanstack/react-router'
import { ChevronRight, TrendingUp, Minus } from 'lucide-react'
import { cn } from '~/lib/utils'
import { POSITION_TO_LINE } from '@regista/shared'
import type { PlayerListItem } from '@regista/shared'

const POSITION_BADGE_STYLES: Record<string, { bg: string; text: string }> = {
  GK: { bg: 'bg-[rgba(234,179,8,0.2)]', text: 'text-[#eab308]' },
  DEF: { bg: 'bg-[rgba(59,130,246,0.2)]', text: 'text-[#60a5fa]' },
  MID: { bg: 'bg-[rgba(168,85,247,0.2)]', text: 'text-[#c084fc]' },
  ATT: { bg: 'bg-[rgba(249,115,22,0.2)]', text: 'text-[#fb923c]' },
}

function getPlayerStatus(player: PlayerListItem) {
  if (player.isInjured) return 'injured'
  if (player.isSuspended) return 'suspended'
  if (player.fatigue > 70) return 'fatigued'
  return 'available'
}

const STATUS_STYLES = {
  available: { dot: 'bg-pelouse-light', border: 'border-transparent', bg: 'bg-[#111c16]', barColor: 'bg-pelouse-light' },
  fatigued: { dot: 'bg-[#f3632d]', border: 'border-[#f3632d]', bg: 'bg-[rgba(38,57,44,0.2)]', barColor: 'bg-[#f3632d]' },
  injured: { dot: 'bg-loss', border: 'border-loss', bg: 'bg-[rgba(255,180,171,0.05)]', barColor: 'bg-loss' },
  suspended: { dot: 'bg-loss', border: 'border-loss', bg: 'bg-[rgba(255,180,171,0.05)]', barColor: 'bg-loss' },
}

interface SquadPlayerRowProps {
  player: PlayerListItem
}

export function SquadPlayerRow({ player }: SquadPlayerRowProps) {
  const navigate = useNavigate()
  const status = getPlayerStatus(player)
  const styles = STATUS_STYLES[status]
  const line = POSITION_TO_LINE[player.position]
  const badge = POSITION_BADGE_STYLES[line] ?? POSITION_BADGE_STYLES.MID
  const fitness = 100 - player.fatigue
  const hasPotentialGrowth = player.potential > player.overall

  let statusLabel: string
  let statusColor: string
  if (status === 'injured') {
    statusLabel = player.injuryMatchesRemaining > 0 ? `${player.injuryMatchesRemaining} Weeks` : 'Injured'
    statusColor = 'text-loss'
  } else if (status === 'suspended') {
    statusLabel = player.suspensionMatchesRemaining > 0 ? `${player.suspensionMatchesRemaining} Games` : 'Suspended'
    statusColor = 'text-loss'
  } else if (status === 'fatigued') {
    statusLabel = 'Fatigued'
    statusColor = 'text-[#f3632d]'
  } else {
    statusLabel = 'Available'
    statusColor = 'text-pelouse-light'
  }

  const fitnessLabel = fitness >= 100 ? 'Full Fitness' : status === 'injured' ? 'Injured' : `${fitness}% Fit`
  const fitnessColor = fitness >= 70 ? 'text-[#889488]' : fitness >= 40 ? 'text-[#f3632d]' : 'text-loss'

  return (
    <button
      onClick={() => navigate({ to: '/player/$playerId', params: { playerId: player.id } })}
      className={cn(
        'flex h-16 w-full items-center rounded-xl border-l-4 pl-7 pr-6 text-left transition-colors hover:bg-[rgba(28,46,34,0.3)]',
        styles.border,
        styles.bg,
      )}
    >
      {/* Status dot */}
      <div className="w-9 shrink-0">
        <div className={cn('h-3 w-3 rounded-full', styles.dot)} />
      </div>

      {/* Name + position + nationality */}
      <div className="flex min-w-[200px] flex-1 flex-col gap-1">
        <span className="font-body text-lg font-bold leading-tight text-text-primary">
          {player.firstName} {player.lastName}
        </span>
        <div className="flex items-center gap-2">
          <span className={cn('rounded px-2 py-0.5 font-display text-[10px] font-extrabold tracking-[0.5px]', badge.bg, badge.text)}>
            {player.position}
          </span>
          <span className="font-body text-xs text-[#889488]">
            {player.nationality}
          </span>
        </div>
      </div>

      {/* Age */}
      <div className="hidden w-16 shrink-0 sm:block">
        <span className="font-display text-lg font-bold text-[#889488]">{player.age}</span>
      </div>

      {/* Overall */}
      <div className="hidden w-32 shrink-0 flex-col items-center md:flex">
        <span className="font-display text-2xl font-extrabold text-pelouse-light">{player.overall}</span>
        <span className="font-body text-[10px] font-bold uppercase tracking-[1px] text-[rgba(113,220,146,0.6)]">
          Overall
        </span>
      </div>

      {/* Potential trend */}
      <div className="hidden w-24 shrink-0 lg:flex items-center gap-1">
        {hasPotentialGrowth ? (
          <>
            <TrendingUp className="h-3 w-3 text-pelouse-light" />
            <span className="font-display text-sm font-bold text-pelouse-light">{player.potential}</span>
          </>
        ) : (
          <>
            <Minus className="h-3 w-3 text-[#889488]" />
            <span className="font-display text-sm font-bold text-[#889488]">{player.potential}</span>
          </>
        )}
      </div>

      {/* Fitness bar */}
      <div className="hidden w-48 shrink-0 flex-col gap-1 px-8 xl:flex">
        <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-[#26392c]', status === 'injured' && 'opacity-40')}>
          <div
            className={cn('h-full rounded-full transition-all', styles.barColor)}
            style={{ width: `${fitness}%` }}
          />
        </div>
        <span className={cn('text-right font-body text-[10px] font-bold uppercase', fitnessColor)}>
          {fitnessLabel}
        </span>
      </div>

      {/* Status text */}
      <div className="hidden w-32 shrink-0 text-right xl:block">
        <span className={cn('font-display text-sm font-bold uppercase tracking-[1.4px]', statusColor)}>
          {statusLabel}
        </span>
      </div>

      {/* Chevron */}
      <ChevronRight className="ml-2 h-3 w-3 shrink-0 text-[#889488]" />
    </button>
  )
}
