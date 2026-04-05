import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useAuth } from '~/hooks/use-auth'
import { AppLayout } from '~/components/layout/app-layout'
import { StandingsTable } from '~/components/competition/standings-table'
import { fetchStandings, fetchScorers, fetchSeasonHistory } from '~/lib/competition'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Trophy, Target, History } from 'lucide-react'
import { cn } from '~/lib/utils'

export const Route = createFileRoute('/competition')({
  component: CompetitionPage,
})

type Tab = 'standings' | 'scorers' | 'history'

function CompetitionPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('standings')

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate({ to: '/login' })
  }, [isAuthenticated, isLoading, navigate])

  const { data: standingsData, isPending: standingsPending } = useQuery({
    queryKey: ['competition', 'standings'],
    queryFn: fetchStandings,
    enabled: isAuthenticated && !isLoading && tab === 'standings',
  })

  const { data: scorersData } = useQuery({
    queryKey: ['competition', 'scorers'],
    queryFn: () => fetchScorers(20),
    enabled: isAuthenticated && !isLoading && tab === 'scorers',
  })

  const { data: historyData } = useQuery({
    queryKey: ['competition', 'history'],
    queryFn: fetchSeasonHistory,
    enabled: isAuthenticated && !isLoading && tab === 'history',
  })

  if (isLoading || !isAuthenticated) return null

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Header */}
        {standingsData && tab === 'standings' && (
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{standingsData.division.name}</h1>
              <p className="text-sm text-muted-foreground">
                {standingsData.league.name} — Season {standingsData.season.number} — Matchday {standingsData.season.currentMatchday}/{standingsData.season.totalMatchdays}
              </p>
            </div>
            <Trophy className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
        {tab !== 'standings' && (
          <h1 className="text-2xl font-bold">Competition</h1>
        )}

        {/* Tabs */}
        <div className="flex gap-1">
          <Button variant={tab === 'standings' ? 'default' : 'outline'} size="sm" onClick={() => setTab('standings')}>
            <Trophy className="mr-1 h-3 w-3" /> Standings
          </Button>
          <Button variant={tab === 'scorers' ? 'default' : 'outline'} size="sm" onClick={() => setTab('scorers')}>
            <Target className="mr-1 h-3 w-3" /> Top Scorers
          </Button>
          <Button variant={tab === 'history' ? 'default' : 'outline'} size="sm" onClick={() => setTab('history')}>
            <History className="mr-1 h-3 w-3" /> Season History
          </Button>
        </div>

        {/* Standings tab */}
        {tab === 'standings' && (
          standingsPending ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : standingsData ? (
            <>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1"><div className="h-3 w-1 rounded bg-amber-500" /> Champion</div>
                <div className="flex items-center gap-1"><div className="h-3 w-1 rounded bg-emerald-500" /> Promotion</div>
                <div className="flex items-center gap-1"><div className="h-3 w-1 rounded bg-red-500" /> Relegation</div>
              </div>
              <StandingsTable standings={standingsData.standings} />
            </>
          ) : (
            <p className="py-12 text-center text-muted-foreground">No competition data</p>
          )
        )}

        {/* Scorers tab */}
        {tab === 'scorers' && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Top Scorers</CardTitle>
            </CardHeader>
            <CardContent>
              {(scorersData?.scorers ?? []).length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No goals scored yet this season</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-xs text-muted-foreground">
                        <th className="px-2 py-2 text-left">#</th>
                        <th className="px-2 py-2 text-left">Player</th>
                        <th className="px-2 py-2 text-left">Club</th>
                        <th className="px-2 py-2 text-center">⚽</th>
                        <th className="px-2 py-2 text-center">🅰️</th>
                        <th className="hidden px-2 py-2 text-center sm:table-cell">Matches</th>
                        <th className="hidden px-2 py-2 text-center sm:table-cell">Avg Rating</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(scorersData?.scorers ?? []).map((s, i) => (
                        <tr
                          key={s.playerId}
                          className={cn(
                            'border-b border-border/50',
                            s.isCurrentClub && 'bg-primary/10 font-semibold',
                          )}
                        >
                          <td className="px-2 py-2 text-muted-foreground">{i + 1}</td>
                          <td className="px-2 py-2">
                            {s.playerName}
                            <Badge variant="outline" className="ml-1 text-[8px]">{s.position}</Badge>
                          </td>
                          <td className="px-2 py-2 text-xs text-muted-foreground">{s.clubName}</td>
                          <td className="px-2 py-2 text-center font-bold">{s.goals}</td>
                          <td className="px-2 py-2 text-center">{s.assists}</td>
                          <td className="hidden px-2 py-2 text-center text-muted-foreground sm:table-cell">{s.matches}</td>
                          <td className="hidden px-2 py-2 text-center sm:table-cell">{s.avgRating}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* History tab */}
        {tab === 'history' && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Season History</CardTitle>
            </CardHeader>
            <CardContent>
              {(historyData?.seasons ?? []).length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No completed seasons yet</p>
              ) : (
                <div className="space-y-2">
                  {(historyData?.seasons ?? []).map((s) => (
                    <div key={s.seasonId} className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div>
                        <p className="font-medium">Season {s.number} — {s.divisionName}</p>
                        <p className="text-xs text-muted-foreground">
                          Position #{s.finalPosition} · {s.points} pts
                        </p>
                      </div>
                      <div className="flex gap-1">
                        {s.champion && <Badge className="bg-amber-500 text-black">🏆 Champion</Badge>}
                        {s.promoted && !s.champion && <Badge className="bg-emerald-500">↗ Promoted</Badge>}
                        {s.relegated && <Badge variant="destructive">↘ Relegated</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}
