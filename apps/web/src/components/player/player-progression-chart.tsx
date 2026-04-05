import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from 'recharts'
import type { Player } from '@regista/shared'

interface OverallHistoryEntry {
  matchday: number
  overall: number
}

interface PlayerProgressionChartProps {
  overallHistory: OverallHistoryEntry[]
  player: Player
}

export function PlayerProgressionChart({ overallHistory, player }: PlayerProgressionChartProps) {
  if (overallHistory.length < 2) {
    return (
      <div className="flex h-[284px] flex-col rounded-3xl bg-surface p-6">
        <h3 className="font-heading text-sm font-normal uppercase tracking-[1.4px] text-[#bdcabc]">
          Overall Progression
        </h3>
        <div className="flex flex-1 items-center justify-center">
          <p className="font-body text-sm text-[#889488]">Not enough data yet</p>
        </div>
      </div>
    )
  }

  const minOverall = Math.min(...overallHistory.map((h) => h.overall))
  const yMin = Math.max(0, minOverall - 5)
  const yMax = player.potential + 3

  return (
    <div className="relative flex h-[284px] flex-col rounded-3xl bg-surface p-6">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-sm font-normal uppercase tracking-[1.4px] text-[#bdcabc]">
          Overall Progression
        </h3>

        {/* Legend */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="size-2 bg-pelouse-light" />
            <span className="font-body text-[10px] font-bold uppercase text-text-primary">Current</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="size-2 bg-[#f3632d]" />
            <span className="font-body text-[10px] font-bold uppercase text-text-primary">
              Potential ({player.potential})
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={overallHistory}>
            <XAxis
              dataKey="matchday"
              tick={{ fill: '#bdcabc', fontSize: 10, fontWeight: 700 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[yMin, yMax]}
              tick={false}
              axisLine={false}
              tickLine={false}
              width={0}
            />
            <ReferenceLine
              y={player.potential}
              stroke="#f3632d"
              strokeDasharray="8 6"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="overall"
              stroke="#71dc92"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, fill: '#71dc92', strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
