import { cn } from '~/lib/utils'

interface StatusBadgeProps {
  count: number
  label: string
  color: 'green' | 'pink' | 'orange'
}

const BADGE_STYLES = {
  green: {
    bg: 'bg-[rgba(113,220,146,0.1)]',
    border: 'border-[rgba(113,220,146,0.2)]',
    dot: 'bg-pelouse-light',
    text: 'text-pelouse-light',
  },
  pink: {
    bg: 'bg-[rgba(255,180,171,0.1)]',
    border: 'border-[rgba(255,180,171,0.2)]',
    dot: 'bg-loss',
    text: 'text-loss',
  },
  orange: {
    bg: 'bg-[rgba(243,99,45,0.1)]',
    border: 'border-[rgba(243,99,45,0.2)]',
    dot: 'bg-[#f3632d]',
    text: 'text-[#f3632d]',
  },
}

function StatusBadge({ count, label, color }: StatusBadgeProps) {
  const s = BADGE_STYLES[color]
  return (
    <div className={cn('flex items-center gap-2 rounded-xl border px-4 py-2', s.bg, s.border)}>
      <div className={cn('h-2 w-2 rounded-full', s.dot)} />
      <span className={cn('font-display text-base font-bold uppercase', s.text)}>
        {count} {label}
      </span>
    </div>
  )
}

interface SquadHeaderProps {
  totalPlayers: number
  available: number
  injuredSuspended: number
  fatigued: number
}

export function SquadHeader({ totalPlayers, available, injuredSuspended, fatigued }: SquadHeaderProps) {
  return (
    <div className="flex items-end justify-between">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-5xl font-extrabold uppercase tracking-tight text-text-primary">
          Squad
        </h1>
        <p className="font-body text-lg text-[rgba(113,220,146,0.6)]">
          {totalPlayers} players in first team
        </p>
      </div>
      <div className="hidden gap-3 md:flex">
        <StatusBadge count={available} label="Available" color="green" />
        {injuredSuspended > 0 && (
          <StatusBadge count={injuredSuspended} label="Injured / Suspended" color="pink" />
        )}
        {fatigued > 0 && (
          <StatusBadge count={fatigued} label="Fatigued" color="orange" />
        )}
      </div>
    </div>
  )
}
