import type { StandingWithClub } from '@regista/shared'
import { cn } from '~/lib/utils'
import { FormIndicator } from './form-indicator'

interface StandingsTableProps {
  standings: StandingWithClub[]
}

const ZONE_STYLES: Record<string, string> = {
  champion: 'border-l-4 border-l-amber-500',
  promotion: 'border-l-4 border-l-emerald-500',
  neutral: 'border-l-4 border-l-transparent',
  relegation: 'border-l-4 border-l-red-500',
}

export function StandingsTable({ standings }: StandingsTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="w-8 px-3 py-2 text-left">#</th>
            <th className="px-3 py-2 text-left">Club</th>
            <th className="w-10 px-2 py-2 text-center">P</th>
            <th className="w-10 px-2 py-2 text-center">W</th>
            <th className="w-10 px-2 py-2 text-center">D</th>
            <th className="w-10 px-2 py-2 text-center">L</th>
            <th className="hidden w-10 px-2 py-2 text-center sm:table-cell">GF</th>
            <th className="hidden w-10 px-2 py-2 text-center sm:table-cell">GA</th>
            <th className="w-10 px-2 py-2 text-center">GD</th>
            <th className="w-12 px-2 py-2 text-center font-bold">Pts</th>
            <th className="hidden w-24 px-2 py-2 text-center md:table-cell">Form</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((row) => (
            <tr
              key={row.id}
              className={cn(
                'border-b border-border transition-colors hover:bg-accent/30',
                row.isCurrentClub && 'bg-primary/10 font-semibold',
                ZONE_STYLES[row.zone],
              )}
            >
              <td className="px-3 py-2 text-muted-foreground">{row.position}</td>
              <td className="px-3 py-2">
                <div className="flex items-center gap-2">
                  <div
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: row.club.primaryColor }}
                  />
                  <span className={cn(row.isCurrentClub && 'text-primary')}>
                    {row.club.name}
                  </span>
                </div>
              </td>
              <td className="px-2 py-2 text-center text-muted-foreground">{row.played}</td>
              <td className="px-2 py-2 text-center">{row.won}</td>
              <td className="px-2 py-2 text-center">{row.drawn}</td>
              <td className="px-2 py-2 text-center">{row.lost}</td>
              <td className="hidden px-2 py-2 text-center text-muted-foreground sm:table-cell">{row.goalsFor}</td>
              <td className="hidden px-2 py-2 text-center text-muted-foreground sm:table-cell">{row.goalsAgainst}</td>
              <td className="px-2 py-2 text-center">
                {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
              </td>
              <td className="px-2 py-2 text-center font-bold">{row.points}</td>
              <td className="hidden px-2 py-2 text-center md:table-cell">
                <FormIndicator form={row.form} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
