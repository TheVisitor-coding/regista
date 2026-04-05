import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useAuth } from '~/hooks/use-auth'
import { AppLayout } from '~/components/layout/app-layout'
import { SquadHeader } from '~/components/squad/squad-header'
import { SquadFilters } from '~/components/squad/squad-filters'
import { SquadPlayerRow } from '~/components/squad/squad-player-row'
import { SquadCompositionWidget } from '~/components/squad/squad-composition-widget'
import { fetchSquad } from '~/lib/squad'
import { POSITION_TO_LINE, type PlayerListItem } from '@regista/shared'
import { Users } from 'lucide-react'
import { FootballLoader } from '~/components/ui/football-loader'

export const Route = createFileRoute('/squad')({
  component: SquadPage,
})

const LINE_LABELS = {
  GK: 'Goalkeepers',
  DEF: 'Defenders',
  MID: 'Midfielders',
  ATT: 'Attackers',
} as const

const LINE_ORDER = ['GK', 'DEF', 'MID', 'ATT'] as const

function SquadPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const [positionFilter, setPositionFilter] = useState('')
  const [sortBy, setSortBy] = useState('position')

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({ to: '/login' })
    }
  }, [isAuthenticated, isLoading, navigate])

  const { data, isPending } = useQuery({
    queryKey: ['squad', positionFilter, sortBy],
    queryFn: () => fetchSquad({ line: positionFilter || undefined, sortBy }),
    enabled: isAuthenticated && !isLoading,
  })

  if (isLoading || !isAuthenticated) return null

  const players = data?.players ?? []

  // Group by line
  const grouped = new Map<string, PlayerListItem[]>()
  for (const line of LINE_ORDER) {
    grouped.set(line, [])
  }
  for (const p of players) {
    const line = POSITION_TO_LINE[p.position as keyof typeof POSITION_TO_LINE] ?? 'ATT'
    grouped.get(line)?.push(p)
  }

  // Compute squad stats
  const available = players.filter((p) => !p.isInjured && !p.isSuspended && p.fatigue <= 70).length
  const injuredSuspended = players.filter((p) => p.isInjured || p.isSuspended).length
  const fatigued = players.filter((p) => !p.isInjured && !p.isSuspended && p.fatigue > 70).length

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 fade-in">
        <SquadHeader
          totalPlayers={players.length}
          available={available}
          injuredSuspended={injuredSuspended}
          fatigued={fatigued}
        />

        <SquadFilters
          activeFilter={positionFilter}
          onFilterChange={setPositionFilter}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />

        {isPending ? (
          <div className="flex justify-center py-12">
            <FootballLoader size="lg" text="Loading squad..." />
          </div>
        ) : players.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-text-secondary">
            <Users className="h-12 w-12 opacity-30" />
            <p className="font-body text-lg">No players in your squad</p>
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            {LINE_ORDER.map((line) => {
              const linePlayers = grouped.get(line) ?? []
              if (linePlayers.length === 0) return null

              return (
                <div key={line} className="flex flex-col gap-4">
                  <h2 className="pl-1 font-display text-xs font-semibold uppercase tracking-[2.4px] text-[#3e4a3f]">
                    {LINE_LABELS[line]} ({linePlayers.length})
                  </h2>
                  <div className="flex flex-col gap-2">
                    {linePlayers.map((p) => (
                      <SquadPlayerRow key={p.id} player={p} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <SquadCompositionWidget players={players} />
    </AppLayout>
  )
}
