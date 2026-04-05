import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'

interface PlayerRadarChartProps {
  stats: Record<string, number> | null
  goalkeeperStats: Record<string, number> | null
  isGK: boolean
  color?: string
}

function avgStats(stats: Record<string, number>, keys: string[]): number {
  const vals = keys.map((k) => stats[k] ?? 0).filter((v) => v > 0)
  return vals.length > 0 ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : 0
}

export function PlayerRadarChart({ stats, goalkeeperStats, isGK, color = '#10b981' }: PlayerRadarChartProps) {
  if (isGK && goalkeeperStats) {
    const data = [
      { stat: 'Reflexes', value: avgStats(goalkeeperStats, ['reflexes', 'diving']) },
      { stat: 'Distribution', value: avgStats(goalkeeperStats, ['kicking', 'communication']) },
      { stat: 'Placement', value: avgStats(goalkeeperStats, ['handling', 'positioning']) },
    ]

    return (
      <ResponsiveContainer width="100%" height={200}>
        <RadarChart data={data}>
          <PolarGrid stroke="rgba(255,255,255,0.1)" />
          <PolarAngleAxis dataKey="stat" tick={{ fill: '#8a9a92', fontSize: 10 }} />
          <PolarRadiusAxis domain={[0, 99]} tick={false} axisLine={false} />
          <Radar dataKey="value" stroke={color} fill={color} fillOpacity={0.25} strokeWidth={2} />
        </RadarChart>
      </ResponsiveContainer>
    )
  }

  if (!stats) return null

  const data = [
    { stat: 'Physical', value: avgStats(stats, ['pace', 'stamina', 'strength', 'agility']) },
    { stat: 'Technical', value: avgStats(stats, ['passing', 'shooting', 'dribbling', 'crossing', 'heading']) },
    { stat: 'Mental', value: avgStats(stats, ['vision', 'composure', 'workRate', 'positioning']) },
    { stat: 'Defense', value: avgStats(stats, ['tackling', 'marking']) },
  ]

  return (
    <ResponsiveContainer width="100%" height={200}>
      <RadarChart data={data}>
        <PolarGrid stroke="rgba(255,255,255,0.1)" />
        <PolarAngleAxis dataKey="stat" tick={{ fill: '#8a9a92', fontSize: 10 }} />
        <PolarRadiusAxis domain={[0, 99]} tick={false} axisLine={false} />
        <Radar dataKey="value" stroke={color} fill={color} fillOpacity={0.25} strokeWidth={2} />
      </RadarChart>
    </ResponsiveContainer>
  )
}
