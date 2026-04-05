import type { DashboardData } from '@regista/shared'
import { SeasonProgressBar } from './season-progress-bar'
import { NextMatchHero } from './next-match-hero'
import { RequiredActions } from './required-actions'
import { RecentResults } from './recent-results'
import { ClubOverviewStrip } from './club-overview-strip'
import { LeagueStandings } from './league-standings'
import { StandingsProjections } from './standings-projections'
import { DashboardFab } from './dashboard-fab'

interface DashboardContentProps {
  data: DashboardData
}

export function DashboardContent({ data }: DashboardContentProps) {
  return (
    <div className="flex flex-col gap-8 fade-in">
      {/* Season Progress */}
      {data.seasonProgress && (
        <SeasonProgressBar
          currentMatchday={data.seasonProgress.currentMatchday}
          totalMatchdays={data.seasonProgress.totalMatchdays}
        />
      )}

      {/* Main grid: 8/4 split */}
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        {/* Left column */}
        <div className="flex flex-col gap-8 xl:col-span-8">
          <NextMatchHero nextMatch={data.nextMatch} />

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <RequiredActions actions={data.quickActions} />
            <RecentResults results={data.recentResults} />
          </div>

          <ClubOverviewStrip
            topScorer={data.topScorer}
            bestFormPlayer={data.bestFormPlayer}
            nextContractExpiry={data.nextContractExpiry}
            trainingIntensity={data.trainingIntensity}
          />
        </div>

        {/* Right column */}
        <div className="xl:col-span-4">
          <LeagueStandings
            standings={data.standingExcerpt}
            divisionName={data.divisionName}
          />
          <StandingsProjections
            standings={data.standingExcerpt}
            nextMatch={data.nextMatch}
          />
        </div>
      </div>

      <DashboardFab />
    </div>
  )
}
