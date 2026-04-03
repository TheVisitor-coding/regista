import type { MatchTeamStats } from '@regista/shared'

interface MatchStatsBarProps {
  homeStats: MatchTeamStats | null
  awayStats: MatchTeamStats | null
}

function StatRow({ label, home, away }: { label: string; home: number; away: number }) {
  const total = home + away || 1
  const homePct = (home / total) * 100

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span>{home}</span>
        <span className="text-muted-foreground">{label}</span>
        <span>{away}</span>
      </div>
      <div className="flex h-1.5 gap-0.5 rounded-full overflow-hidden">
        <div className="bg-primary rounded-l-full" style={{ width: `${homePct}%` }} />
        <div className="bg-muted-foreground/30 rounded-r-full flex-1" />
      </div>
    </div>
  )
}

export function MatchStatsBar({ homeStats, awayStats }: MatchStatsBarProps) {
  if (!homeStats || !awayStats) {
    return <p className="py-4 text-center text-sm text-muted-foreground">No stats available</p>
  }

  return (
    <div className="space-y-3">
      <StatRow label="Possession %" home={Math.round(homeStats.possession)} away={Math.round(awayStats.possession)} />
      <StatRow label="Shots" home={homeStats.shots} away={awayStats.shots} />
      <StatRow label="On Target" home={homeStats.shotsOnTarget} away={awayStats.shotsOnTarget} />
      <StatRow label="Fouls" home={homeStats.fouls} away={awayStats.fouls} />
      <StatRow label="Corners" home={homeStats.corners} away={awayStats.corners} />
      <StatRow label="Yellow Cards" home={homeStats.yellowCards} away={awayStats.yellowCards} />
      <StatRow label="Saves" home={homeStats.saves} away={awayStats.saves} />
    </div>
  )
}
