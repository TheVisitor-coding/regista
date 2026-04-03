import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useAuth } from '~/hooks/use-auth'
import { useClub } from '~/hooks/use-club'
import { AppLayout } from '~/components/layout/app-layout'
import { fetchStandings } from '~/lib/competition'
import { fetchSquad } from '~/lib/squad'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { BarChart3 } from 'lucide-react'

export const Route = createFileRoute('/stats')({
  component: StatsPage,
})

function StatsPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const { club } = useClub()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate({ to: '/login' })
  }, [isAuthenticated, isLoading, navigate])

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
  const avgAge = players.length > 0
    ? Math.round(players.reduce((sum, p) => sum + p.age, 0) / players.length * 10) / 10
    : 0

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-6 w-6 text-muted-foreground" />
          <h1 className="text-2xl font-bold">Statistics</h1>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs text-muted-foreground">Position</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{myStanding?.position ?? '-'}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs text-muted-foreground">Points</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{myStanding?.points ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs text-muted-foreground">Record (W-D-L)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {myStanding ? `${myStanding.won}-${myStanding.drawn}-${myStanding.lost}` : '0-0-0'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs text-muted-foreground">Goal Diff</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {myStanding ? `${myStanding.goalsFor}:${myStanding.goalsAgainst}` : '0:0'}
              </p>
            </CardContent>
          </Card>
        </div>

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
              <p className="text-2xl font-bold">{avgAge}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
