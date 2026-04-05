import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useAuth } from '~/hooks/use-auth'
import { AppLayout } from '~/components/layout/app-layout'
import { fetchClubStats, fetchStandings } from '~/lib/competition'
import { fetchSquad } from '~/lib/squad'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { BarChart3, Trophy, Target, Shield, Zap } from 'lucide-react'

export const Route = createFileRoute('/stats')({
  component: StatsPage,
})

function StatsPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate({ to: '/login' })
  }, [isAuthenticated, isLoading, navigate])

  const { data: clubStats } = useQuery({
    queryKey: ['stats', 'club'],
    queryFn: fetchClubStats,
    enabled: isAuthenticated && !isLoading,
  })

  const { data: standings } = useQuery({
    queryKey: ['competition', 'standings'],
    queryFn: fetchStandings,
    enabled: isAuthenticated && !isLoading,
  })

  const { data: squad } = useQuery({
    queryKey: ['squad'],
    queryFn: () => fetchSquad(),
    enabled: isAuthenticated && !isLoading,
  })

  if (isLoading || !isAuthenticated) return null

  const myStanding = standings?.standings?.find((s) => s.isCurrentClub)
  const players = squad?.players ?? []
  const avgOverall = players.length > 0
    ? Math.round(players.reduce((sum, p) => sum + p.overall, 0) / players.length)
    : 0
  const s = clubStats?.season

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-6 w-6 text-muted-foreground" />
          <h1 className="text-2xl font-bold">Statistics</h1>
        </div>

        {/* Position + Points */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <Trophy className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-3xl font-black">{myStanding?.position ?? '-'}</p>
                <p className="text-[10px] text-muted-foreground">Position</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <Target className="h-8 w-8 text-primary" />
              <div>
                <p className="text-3xl font-black">{myStanding?.points ?? 0}</p>
                <p className="text-[10px] text-muted-foreground">Points</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <Shield className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-3xl font-black">
                  {s ? `${s.won}-${s.drawn}-${s.lost}` : '0-0-0'}
                </p>
                <p className="text-[10px] text-muted-foreground">W-D-L</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <Zap className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-3xl font-black">
                  {s ? `${s.goalsFor}:${s.goalsAgainst}` : '0:0'}
                </p>
                <p className="text-[10px] text-muted-foreground">Goals F:A</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Season details */}
        {s && (
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-xs text-muted-foreground">Clean Sheets</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{s.cleanSheets}</p>
              </CardContent>
            </Card>
            {s.biggestWin && (
              <Card>
                <CardHeader className="pb-1">
                  <CardTitle className="text-xs text-muted-foreground">Biggest Win</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-bold text-emerald-500">{s.biggestWin.score}</p>
                  <p className="text-xs text-muted-foreground">vs {s.biggestWin.opponent}</p>
                </CardContent>
              </Card>
            )}
            {s.biggestLoss && (
              <Card>
                <CardHeader className="pb-1">
                  <CardTitle className="text-xs text-muted-foreground">Biggest Loss</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-bold text-red-500">{s.biggestLoss.score}</p>
                  <p className="text-xs text-muted-foreground">vs {s.biggestLoss.opponent}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Top players */}
        {clubStats?.topPlayers && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Top Players This Season</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-3">
                {clubStats.topPlayers.topScorer && (
                  <div className="rounded-lg border border-border p-3 text-center">
                    <p className="text-2xl">⚽</p>
                    <p className="font-semibold">{clubStats.topPlayers.topScorer.name}</p>
                    <p className="text-xs text-muted-foreground">{clubStats.topPlayers.topScorer.goals} goals</p>
                  </div>
                )}
                {clubStats.topPlayers.topAssists && (
                  <div className="rounded-lg border border-border p-3 text-center">
                    <p className="text-2xl">🅰️</p>
                    <p className="font-semibold">{clubStats.topPlayers.topAssists.name}</p>
                    <p className="text-xs text-muted-foreground">{clubStats.topPlayers.topAssists.assists} assists</p>
                  </div>
                )}
                {clubStats.topPlayers.topRating && (
                  <div className="rounded-lg border border-border p-3 text-center">
                    <p className="text-2xl">⭐</p>
                    <p className="font-semibold">{clubStats.topPlayers.topRating.name}</p>
                    <p className="text-xs text-muted-foreground">{clubStats.topPlayers.topRating.avgRating} avg rating</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Squad overview */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs text-muted-foreground">Squad Size</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{players.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs text-muted-foreground">Avg Overall</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{avgOverall}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs text-muted-foreground">Avg Age</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {players.length > 0 ? (players.reduce((sum, p) => sum + p.age, 0) / players.length).toFixed(1) : '-'}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
