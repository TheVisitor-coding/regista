import { TrendingUp } from 'lucide-react'
import type { DashboardData } from '@regista/shared'

interface ClubOverviewStripProps {
  topScorer: DashboardData['topScorer']
  bestFormPlayer: DashboardData['bestFormPlayer']
  nextContractExpiry: DashboardData['nextContractExpiry']
  trainingIntensity: DashboardData['trainingIntensity']
}

function StatCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col rounded-2xl border border-[rgba(255,255,255,0.05)] bg-surface p-4">
      <span className="font-display text-[10px] font-bold uppercase tracking-[0.5px] text-text-secondary">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </div>
  )
}

export function ClubOverviewStrip({
  topScorer,
  bestFormPlayer,
  nextContractExpiry,
  trainingIntensity,
}: ClubOverviewStripProps) {
  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      {/* Top Scorer */}
      <StatCard label="Top Scorer">
        {topScorer ? (
          <>
            <p className="font-body text-sm font-bold text-white">{topScorer.name}</p>
            <p className="font-display text-xs font-semibold text-pelouse-light">
              {topScorer.goals} goals
            </p>
          </>
        ) : (
          <p className="font-body text-sm text-text-secondary">No data yet</p>
        )}
      </StatCard>

      {/* Best Form Player */}
      <StatCard label="Best Form Player">
        {bestFormPlayer ? (
          <>
            <p className="font-body text-sm font-bold text-white">{bestFormPlayer.name}</p>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-pelouse-light" />
              <span className="font-body text-[10px] font-bold text-pelouse-light">
                {bestFormPlayer.form}
              </span>
            </div>
          </>
        ) : (
          <p className="font-body text-sm text-text-secondary">No data yet</p>
        )}
      </StatCard>

      {/* Next Contract Expiry */}
      <StatCard label="Next Contract Expiry">
        {nextContractExpiry ? (
          <>
            <p className="font-body text-sm font-bold text-white">{nextContractExpiry.name}</p>
            <p className="font-body text-[10px] italic text-orange">
              {nextContractExpiry.matchesLeft} matches left
            </p>
          </>
        ) : (
          <p className="font-body text-sm text-text-secondary">All contracts safe</p>
        )}
      </StatCard>

      {/* Training Intensity */}
      <StatCard label="Training Intensity">
        {trainingIntensity ? (
          <>
            <p className="font-body text-xs font-bold text-white">{trainingIntensity.level}</p>
            <div className="mt-1 h-1 w-full rounded-full bg-[#26392c]">
              <div
                className="h-full rounded-full bg-pelouse-light"
                style={{ width: `${trainingIntensity.percent}%` }}
              />
            </div>
          </>
        ) : (
          <p className="font-body text-sm text-text-secondary">Not set</p>
        )}
      </StatCard>
    </div>
  )
}
