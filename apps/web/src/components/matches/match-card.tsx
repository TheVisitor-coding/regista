import { Link } from '@tanstack/react-router'
import type { Match } from '@regista/shared'
import { cn } from '~/lib/utils'

interface MatchCardProps {
  match: Match
  currentClubId?: string
}

export function MatchCard({ match, currentClubId }: MatchCardProps) {
  const isHome = match.homeClub.id === currentClubId
  const isFinished = match.status === 'finished'

  return (
    <Link
      to="/matches/$matchId"
      params={{ matchId: match.id }}
      className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-accent/30"
    >
      <div className="w-8 text-center text-xs text-muted-foreground">
        J{match.matchday}
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="h-4 w-4 shrink-0 rounded-full"
            style={{ backgroundColor: match.homeClub.primaryColor }}
          />
          <span className={cn('text-sm', match.homeClub.id === currentClubId && 'font-semibold')}>
            {match.homeClub.name}
          </span>
        </div>

        <div className="mx-3 text-center">
          {isFinished ? (
            <span className="font-mono text-sm font-bold">
              {match.homeScore} - {match.awayScore}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">
              {new Date(match.scheduledAt).toLocaleDateString()}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className={cn('text-sm', match.awayClub.id === currentClubId && 'font-semibold')}>
            {match.awayClub.name}
          </span>
          <div
            className="h-4 w-4 shrink-0 rounded-full"
            style={{ backgroundColor: match.awayClub.primaryColor }}
          />
        </div>
      </div>

      <div className="w-12 text-right text-[10px] text-muted-foreground">
        {isHome ? 'HOME' : 'AWAY'}
      </div>
    </Link>
  )
}
