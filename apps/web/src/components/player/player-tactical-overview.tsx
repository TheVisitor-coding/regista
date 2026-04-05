import { PlayerRadarChart } from '~/components/squad/player-radar-chart'

interface PlayerTacticalOverviewProps {
  stats: Record<string, number> | null
  goalkeeperStats: Record<string, number> | null
  isGK: boolean
}

export function PlayerTacticalOverview({ stats, goalkeeperStats, isGK }: PlayerTacticalOverviewProps) {
  return (
    <div className="flex min-h-[320px] flex-col items-start rounded-3xl bg-surface p-6">
      <h3 className="pb-6 font-heading text-sm font-normal uppercase tracking-[1.4px] text-[#bdcabc]">
        Tactical Overview
      </h3>
      <div className="flex w-full items-center justify-center">
        <div className="relative size-[280px]">
          {/* Concentric circles */}
          <div className="absolute inset-0 rounded-full border border-[rgba(62,74,63,0.2)]" />
          <div className="absolute inset-[20%] rounded-full border border-[rgba(62,74,63,0.1)]" />
          <div className="absolute inset-[40%] rounded-full border border-[rgba(62,74,63,0.05)]" />

          {/* Radar chart overlay */}
          <div className="absolute inset-0">
            <PlayerRadarChart
              stats={stats}
              goalkeeperStats={goalkeeperStats}
              isGK={isGK}
              color="#71dc92"
            />
          </div>

          {/* Axis labels */}
          {!isGK && (
            <>
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 font-body text-[10px] font-bold uppercase tracking-[-0.5px] text-[#bdcabc]">
                Technical
              </span>
              <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 font-body text-[10px] font-bold uppercase tracking-[-0.5px] text-[#bdcabc]">
                Defense
              </span>
              <span className="absolute left-[-54px] top-1/2 -translate-y-1/2 font-body text-[10px] font-bold uppercase tracking-[-0.5px] text-[#bdcabc]">
                Physical
              </span>
              <span className="absolute right-[-45px] top-1/2 -translate-y-1/2 font-body text-[10px] font-bold uppercase tracking-[-0.5px] text-[#bdcabc]">
                Mental
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
