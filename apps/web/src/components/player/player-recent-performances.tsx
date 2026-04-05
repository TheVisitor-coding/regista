import { cn } from '~/lib/utils'

interface Performance {
  matchId: string
  matchday: number
  opponent: { name: string }
  minutesPlayed: number
  goals: number
  assists: number
  rating: number
  date: string
}

interface PlayerRecentPerformancesProps {
  performances: Performance[]
}

function getRatingStyle(rating: number) {
  if (rating >= 7.5)
    return {
      bg: 'bg-[rgba(16,185,129,0.2)]',
      border: 'border-[rgba(16,185,129,0.3)]',
      text: 'text-[#34d399]',
    }
  if (rating >= 7.0)
    return {
      bg: 'bg-[rgba(34,197,94,0.2)]',
      border: 'border-[rgba(34,197,94,0.3)]',
      text: 'text-[#4ade80]',
    }
  if (rating >= 6.0)
    return {
      bg: 'bg-[#facc15]',
      border: 'border-[rgba(234,179,8,0.3)]',
      text: 'text-[#021108]',
    }
  return {
    bg: 'bg-[rgba(239,68,68,0.2)]',
    border: 'border-[rgba(239,68,68,0.3)]',
    text: 'text-[#f87171]',
  }
}

export function PlayerRecentPerformances({ performances }: PlayerRecentPerformancesProps) {
  const recent = performances.slice(0, 5)

  return (
    <div className="flex flex-col gap-6 rounded-3xl bg-surface p-6">
      <h3 className="font-heading text-sm font-normal uppercase tracking-[1.4px] text-[#bdcabc]">
        Recent Performances
      </h3>

      <div className="flex flex-col gap-2">
        {recent.length === 0 ? (
          <p className="py-4 text-center font-body text-sm text-[#889488]">No performances yet</p>
        ) : (
          recent.map((p) => {
            const style = getRatingStyle(p.rating)
            return (
              <div
                key={p.matchId}
                className="flex items-center justify-between rounded-xl bg-surface-light p-3"
              >
                <div className="flex items-center gap-4">
                  <span className="font-body text-xs font-bold text-[#bdcabc]">J{p.matchday}</span>
                  <span className="font-body text-base font-medium text-text-primary">
                    vs {p.opponent.name}
                  </span>
                </div>
                <div
                  className={cn(
                    'rounded-full border px-3.5 py-1.5',
                    style.bg,
                    style.border,
                  )}
                >
                  <span className={cn('font-heading text-sm font-bold', style.text)}>
                    {p.rating.toFixed(1)}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
