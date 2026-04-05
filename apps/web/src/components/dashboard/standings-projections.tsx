import { TrendingUp } from 'lucide-react'
import type { DashboardData } from '@regista/shared'

interface StandingsProjectionsProps {
  standings: DashboardData['standingExcerpt']
  nextMatch: DashboardData['nextMatch']
}

export function StandingsProjections({ standings, nextMatch }: StandingsProjectionsProps) {
  if (!nextMatch || standings.length === 0) return null

  // Compute projection: if we win (+3 pts), where do we land?
  const myRow = standings.find((s) => s.isCurrentClub)
  if (!myRow) return null

  const projectedPoints = myRow.points + 3
  // Count how many teams above us would still be above
  const teamsAbove = standings.filter(
    (s) => !s.isCurrentClub && s.points >= projectedPoints,
  )
  const projectedPosition = teamsAbove.length + 1

  // Only show if projection differs from current
  if (projectedPosition >= myRow.position) return null

  const ordinal =
    projectedPosition === 1
      ? '1st'
      : projectedPosition === 2
        ? '2nd'
        : projectedPosition === 3
          ? '3rd'
          : `${projectedPosition}th`

  return (
    <div className="mt-8 rounded-2xl border border-[rgba(113,220,146,0.1)] bg-[rgba(38,57,44,0.2)] p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#112318]">
          <TrendingUp className="h-5 w-5 text-pelouse-light" />
        </div>
        <div>
          <p className="font-body text-xs font-bold text-text-primary">Projections</p>
          <p className="font-body text-[10px] uppercase italic text-text-secondary">
            Projected: Win vs {nextMatch.opponent.name}{' '}
            <span className="text-jaune">↑</span> moves you to {ordinal}
          </p>
        </div>
      </div>
    </div>
  )
}
