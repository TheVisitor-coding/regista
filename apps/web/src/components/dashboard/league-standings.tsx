import { Link } from '@tanstack/react-router'
import { cn } from '~/lib/utils'
import type { DashboardData } from '@regista/shared'

type StandingRow = DashboardData['standingExcerpt'][number]

interface LeagueStandingsProps {
  standings: StandingRow[]
  divisionName: string | null
}

export function LeagueStandings({ standings, divisionName }: LeagueStandingsProps) {
  return (
    <div className="flex flex-col rounded-2xl border border-[rgba(255,255,255,0.05)] bg-surface p-6">
      {/* Header */}
      <div className="flex items-end justify-between pb-6">
        <div>
          <h3 className="font-heading text-xl font-bold uppercase tracking-tight text-text-primary">
            {divisionName ?? 'League'}
          </h3>
          <span className="font-heading text-xs tracking-[0.6px] text-text-secondary">
            STANDINGS
          </span>
        </div>
        <Link to="/competition" className="font-body text-xs font-bold text-pelouse-light hover:underline">
          View all →
        </Link>
      </div>

      {/* Table */}
      <div className="flex flex-col gap-2 py-2">
        {/* Header row */}
        <div className="flex items-center px-4 pb-2">
          <span className="w-12 font-heading text-[10px] font-bold uppercase tracking-[1px] text-text-secondary">
            Pos
          </span>
          <span className="flex-1 font-heading text-[10px] font-bold uppercase tracking-[1px] text-text-secondary">
            Club
          </span>
          <span className="w-10 text-center font-heading text-[10px] font-bold uppercase tracking-[1px] text-text-secondary">
            Pld
          </span>
          <span className="w-10 text-center font-heading text-[10px] font-bold uppercase tracking-[1px] text-text-secondary">
            GD
          </span>
          <span className="w-12 text-right font-heading text-[10px] font-bold uppercase tracking-[1px] text-text-secondary">
            Pts
          </span>
        </div>

        {/* Data rows */}
        {standings.map((row) => {
          const isMe = row.isCurrentClub
          const isOpponent = row.isNextOpponent

          return (
            <div
              key={row.position}
              className={cn(
                'flex items-center rounded-2xl px-4 py-4',
                isMe
                  ? 'border-l-4 border-l-pelouse-light bg-[#26392c]'
                  : isOpponent
                    ? 'border-l-4 border-l-[rgba(243,99,45,0.4)] bg-surface-light'
                    : 'bg-surface-light',
              )}
            >
              <span
                className={cn(
                  'w-12 font-heading text-sm font-bold',
                  isMe ? 'text-pelouse-light' : isOpponent ? 'text-[#ffb59d]' : 'text-text-primary',
                )}
              >
                {row.position}
              </span>
              <div className="flex flex-1 items-center gap-2">
                <span
                  className={cn(
                    'font-body text-sm font-bold',
                    isMe ? 'text-pelouse-light' : 'text-text-primary',
                  )}
                >
                  {row.club}
                </span>
                {isOpponent && (
                  <div className="h-1.5 w-1.5 rounded-full bg-[#f3632d]" />
                )}
              </div>
              <span className="w-10 text-center font-heading text-sm text-text-primary">
                {row.played}
              </span>
              <span
                className={cn(
                  'w-10 text-center font-heading text-sm',
                  row.goalDiff > 0 ? 'text-pelouse-light' : row.goalDiff < 0 ? 'text-loss' : 'text-text-primary',
                )}
              >
                {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
              </span>
              <span className="w-12 text-right font-heading text-sm font-bold text-text-primary">
                {row.points}
              </span>
            </div>
          )
        })}

        {standings.length === 0 && (
          <p className="py-8 text-center font-body text-sm text-text-secondary">
            No standings data available
          </p>
        )}
      </div>
    </div>
  )
}
