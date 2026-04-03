import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useAuth } from '~/hooks/use-auth'
import { AppLayout } from '~/components/layout/app-layout'
import { PlayerRow } from '~/components/squad/player-row'
import { fetchSquad } from '~/lib/squad'
import { POSITION_TO_LINE, type PlayerListItem } from '@regista/shared'
import { Button } from '~/components/ui/button'
import { Users } from 'lucide-react'

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
  const [filter, setFilter] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({ to: '/login' })
    }
  }, [isAuthenticated, isLoading, navigate])

  const { data, isPending } = useQuery({
    queryKey: ['squad', filter],
    queryFn: () => fetchSquad({ line: filter ?? undefined }),
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

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Squad</h1>
          <p className="text-sm text-muted-foreground">{players.length} players</p>
        </div>

        {/* Line filter */}
        <div className="flex gap-2">
          <Button
            variant={filter === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(null)}
          >
            All
          </Button>
          {LINE_ORDER.map((line) => (
            <Button
              key={line}
              variant={filter === line ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(line)}
            >
              {LINE_LABELS[line]}
            </Button>
          ))}
        </div>

        {isPending ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : players.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
            <Users className="h-12 w-12 opacity-30" />
            <p>No players in your squad</p>
          </div>
        ) : (
          LINE_ORDER.map((line) => {
            const linePlayers = grouped.get(line) ?? []
            if (linePlayers.length === 0 && filter !== null) return null

            return (
              <div key={line} className="space-y-2">
                <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                  {LINE_LABELS[line]} ({linePlayers.length})
                </h2>
                <div className="space-y-1">
                  {linePlayers.map((p) => (
                    <PlayerRow
                      key={p.id}
                      player={p}
                      onClick={() => navigate({ to: '/squad/$playerId', params: { playerId: p.id } })}
                    />
                  ))}
                </div>
              </div>
            )
          })
        )}
      </div>
    </AppLayout>
  )
}
