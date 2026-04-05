import type { MatchSummary } from '~/lib/match-detail'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { cn } from '~/lib/utils'
import { MatchStatsBar } from './match-stats-bar'

interface PostMatchSummaryProps {
  summary: MatchSummary
}

function ratingColor(r: number): string {
  if (r >= 8.0) return 'text-emerald-400'
  if (r >= 7.0) return 'text-green-400'
  if (r >= 6.0) return 'text-yellow-400'
  if (r >= 5.0) return 'text-orange-400'
  return 'text-red-400'
}

const HIGHLIGHT_ICONS: Record<string, string> = {
  goal: '⚽',
  yellow_card: '🟨',
  red_card: '🟥',
  injury: '🏥',
  substitution: '🔄',
  penalty: '⚡',
}

export function PostMatchSummary({ summary }: PostMatchSummaryProps) {
  const resultLabel = summary.result === 'win' ? 'VICTORY' : summary.result === 'draw' ? 'DRAW' : summary.result === 'loss' ? 'DEFEAT' : ''
  const resultColor = summary.result === 'win' ? 'text-emerald-400' : summary.result === 'draw' ? 'text-zinc-400' : 'text-red-400'

  return (
    <div className="space-y-4">
      {/* Result banner */}
      <div className="text-center">
        <p className={cn('text-lg font-black uppercase tracking-wider', resultColor)}>
          {resultLabel}
        </p>
      </div>

      {/* MOTM */}
      {summary.motm && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="flex items-center gap-3 p-4">
            <span className="text-2xl">⭐</span>
            <div>
              <p className="text-xs text-amber-500 font-semibold uppercase">Man of the Match</p>
              <p className="font-bold">{summary.motm.name}</p>
              <p className="text-xs text-muted-foreground">
                Rating: <span className={cn('font-bold', ratingColor(summary.motm.rating))}>{summary.motm.rating.toFixed(1)}</span>
                {summary.motm.goals > 0 && ` · ${summary.motm.goals} goal${summary.motm.goals > 1 ? 's' : ''}`}
                {summary.motm.assists > 0 && ` · ${summary.motm.assists} assist${summary.motm.assists > 1 ? 's' : ''}`}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Highlights */}
      {summary.highlights.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Key Moments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {summary.highlights.map((h, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="w-8 text-right font-mono text-xs text-muted-foreground">{h.minute}'</span>
                <span>{HIGHLIGHT_ICONS[h.type] ?? '•'}</span>
                <span className="text-xs">
                  {h.playerName ?? h.type.replace(/_/g, ' ')}
                  {h.secondaryPlayerName && <span className="text-muted-foreground"> (assist: {h.secondaryPlayerName})</span>}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Player Ratings */}
      {summary.playerRatings.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Player Ratings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-1 sm:grid-cols-2">
              {summary.playerRatings.slice(0, 14).map((p) => (
                <div key={p.playerId} className="flex items-center justify-between rounded px-2 py-1 text-xs hover:bg-accent/20">
                  <span className="truncate">{p.name}</span>
                  <div className="flex items-center gap-2">
                    {p.goals > 0 && <span>⚽{p.goals}</span>}
                    {p.assists > 0 && <span>🅰️{p.assists}</span>}
                    <span className={cn('font-bold', ratingColor(p.rating))}>{p.rating.toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      {summary.stats.length === 2 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Match Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <MatchStatsBar homeStats={summary.stats[0]} awayStats={summary.stats[1]} />
          </CardContent>
        </Card>
      )}

      {/* Assistant comment */}
      {summary.assistantComment && (
        <Card className="border-primary/20">
          <CardContent className="flex gap-3 p-4">
            <span className="text-xl">💬</span>
            <div>
              <p className="text-xs font-semibold text-primary">Assistant Coach</p>
              <p className="mt-1 text-sm text-muted-foreground italic">"{summary.assistantComment}"</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
