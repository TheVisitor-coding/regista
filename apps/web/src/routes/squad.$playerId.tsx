import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useAuth } from '~/hooks/use-auth'
import { AppLayout } from '~/components/layout/app-layout'
import { fetchPlayerDetail } from '~/lib/squad'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { cn } from '~/lib/utils'

export const Route = createFileRoute('/squad/$playerId')({
  component: PlayerDetailPage,
})

function statColor(value: number): string {
  if (value >= 75) return 'text-emerald-500'
  if (value >= 60) return 'text-yellow-500'
  if (value >= 45) return 'text-orange-500'
  return 'text-red-500'
}

function StatBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-24 text-xs text-muted-foreground">{label}</span>
      <div className="h-2 flex-1 rounded-full bg-muted">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            value >= 75 ? 'bg-emerald-500' :
            value >= 60 ? 'bg-yellow-500' :
            value >= 45 ? 'bg-orange-500' : 'bg-red-500',
          )}
          style={{ width: `${Math.min(value, 99)}%` }}
        />
      </div>
      <span className={cn('w-8 text-right text-xs font-medium', statColor(value))}>
        {Math.round(value)}
      </span>
    </div>
  )
}

function PlayerDetailPage() {
  const { playerId } = Route.useParams()
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({ to: '/login' })
    }
  }, [isAuthenticated, isLoading, navigate])

  const { data, isPending } = useQuery({
    queryKey: ['squad', playerId],
    queryFn: () => fetchPlayerDetail(playerId),
    enabled: isAuthenticated && !isLoading,
  })

  if (isLoading || !isAuthenticated) return null

  if (isPending) {
    return (
      <AppLayout>
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </AppLayout>
    )
  }

  if (!data) return null

  const { player, stats, goalkeeperStats: gkStats } = data

  return (
    <AppLayout>
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/squad' })}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to squad
        </Button>

        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-2xl font-bold">
            {player.overall}
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              {player.firstName} {player.lastName}
            </h1>
            <div className="mt-1 flex items-center gap-2">
              <Badge>{player.position}</Badge>
              <span className="text-sm text-muted-foreground">
                {player.nationality} · Age {player.age}
              </span>
            </div>
          </div>
        </div>

        {/* Info cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Potential</p>
              <p className="text-xl font-bold">{player.potential}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Contract</p>
              <p className="text-xl font-bold">{player.contractMatchesRemaining} matches</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Weekly Salary</p>
              <p className="text-xl font-bold">{(player.weeklySalary / 100).toLocaleString()} G$</p>
            </CardContent>
          </Card>
        </div>

        {/* Condition */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Condition</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <StatBar label="Fatigue" value={player.fatigue} />
            <StatBar label="Fitness" value={100 - player.fatigue} />
            {player.isInjured && (
              <p className="text-sm text-red-500">
                Injured: {player.injuryType ?? 'Unknown'} ({player.injuryMatchesRemaining} matches remaining)
              </p>
            )}
            {player.isSuspended && (
              <p className="text-sm text-red-500">
                Suspended: {player.suspensionMatchesRemaining} matches remaining
              </p>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        {stats && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Physical</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <StatBar label="Pace" value={stats.pace} />
                <StatBar label="Stamina" value={stats.stamina} />
                <StatBar label="Strength" value={stats.strength} />
                <StatBar label="Agility" value={stats.agility} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Technical</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <StatBar label="Passing" value={stats.passing} />
                <StatBar label="Shooting" value={stats.shooting} />
                <StatBar label="Dribbling" value={stats.dribbling} />
                <StatBar label="Crossing" value={stats.crossing} />
                <StatBar label="Heading" value={stats.heading} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Mental</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <StatBar label="Vision" value={stats.vision} />
                <StatBar label="Composure" value={stats.composure} />
                <StatBar label="Work Rate" value={stats.workRate} />
                <StatBar label="Positioning" value={stats.positioning} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Defense</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <StatBar label="Tackling" value={stats.tackling} />
                <StatBar label="Marking" value={stats.marking} />
                <StatBar label="Penalties" value={stats.penalties} />
                <StatBar label="Free Kick" value={stats.freeKick} />
              </CardContent>
            </Card>
          </div>
        )}

        {/* GK Stats */}
        {gkStats && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Goalkeeper</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <StatBar label="Reflexes" value={gkStats.reflexes} />
              <StatBar label="Diving" value={gkStats.diving} />
              <StatBar label="Handling" value={gkStats.handling} />
              <StatBar label="Positioning" value={gkStats.positioning} />
              <StatBar label="Kicking" value={gkStats.kicking} />
              <StatBar label="Communication" value={gkStats.communication} />
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}
