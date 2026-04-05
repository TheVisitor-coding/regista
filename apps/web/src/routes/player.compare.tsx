import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useAuth } from '~/hooks/use-auth'
import { useClub } from '~/hooks/use-club'
import { AppLayout } from '~/components/layout/app-layout'
import { comparePlayers } from '~/lib/squad'
import { PlayerRadarChart } from '~/components/squad/player-radar-chart'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { ArrowLeft } from 'lucide-react'
import { cn } from '~/lib/utils'

export const Route = createFileRoute('/player/compare')({
  component: ComparisonPage,
  validateSearch: (search: Record<string, unknown>) => ({
    player1: (search.player1 as string) ?? '',
    player2: (search.player2 as string) ?? '',
  }),
})

function StatCompare({ label, val1, val2 }: { label: string; val1: number; val2: number }) {
  const better1 = val1 > val2
  const better2 = val2 > val1

  return (
    <div className="flex items-center gap-2 py-0.5">
      <span className={cn('w-8 text-right text-[10px] font-medium', better1 ? 'text-emerald-500' : 'text-muted-foreground')}>
        {Math.round(val1)}
      </span>
      <div className="flex h-1 flex-1 gap-0.5 rounded-full overflow-hidden">
        <div className={cn('rounded-l-full', better1 ? 'bg-emerald-500' : 'bg-muted')} style={{ width: `${val1}%` }} />
        <div className={cn('rounded-r-full', better2 ? 'bg-emerald-500' : 'bg-muted')} style={{ width: `${val2}%` }} />
      </div>
      <span className={cn('w-8 text-[10px] font-medium', better2 ? 'text-emerald-500' : 'text-muted-foreground')}>
        {Math.round(val2)}
      </span>
      <span className="w-16 text-[9px] text-muted-foreground">{label}</span>
    </div>
  )
}

function ComparisonPage() {
  const { player1, player2 } = Route.useSearch()
  const { isAuthenticated, isLoading } = useAuth()
  const { club } = useClub()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate({ to: '/login' })
  }, [isAuthenticated, isLoading, navigate])

  const { data, isPending } = useQuery({
    queryKey: ['squad', 'compare', player1, player2],
    queryFn: () => comparePlayers(player1, player2),
    enabled: isAuthenticated && !isLoading && !!player1 && !!player2,
  })

  if (isLoading || !isAuthenticated) return null

  const players = data?.players ?? []
  const p1 = players[0]
  const p2 = players[1]

  return (
    <AppLayout>
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/squad' })}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to squad
        </Button>

        <h1 className="text-2xl font-bold">Player Comparison</h1>

        {isPending ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : p1 && p2 ? (
          <>
            {/* Headers */}
            <div className="grid grid-cols-2 gap-4">
              {[p1, p2].map((p) => (
                <Card key={p.id}>
                  <CardContent className="flex items-center gap-3 p-4">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white"
                      style={{ backgroundColor: club?.primaryColor }}
                    >
                      {p.overall}
                    </div>
                    <div>
                      <p className="font-semibold">{p.firstName} {p.lastName}</p>
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="text-[9px]">{p.position}</Badge>
                        <span className="text-[10px] text-muted-foreground">Age {p.age} · Pot. {p.potential}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Stats comparison */}
            {p1.stats && p2.stats && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Stats Comparison</CardTitle>
                </CardHeader>
                <CardContent className="space-y-0.5">
                  {Object.keys(p1.stats).map((key) => (
                    <StatCompare
                      key={key}
                      label={key}
                      val1={(p1.stats as any)[key]}
                      val2={(p2.stats as any)[key]}
                    />
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Info comparison */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <span className="text-right font-medium">{p1.age}</span>
                  <span className="text-center text-muted-foreground">Age</span>
                  <span className="font-medium">{p2.age}</span>

                  <span className="text-right font-medium">{p1.overall}</span>
                  <span className="text-center text-muted-foreground">Overall</span>
                  <span className="font-medium">{p2.overall}</span>

                  <span className="text-right font-medium">{p1.potential}</span>
                  <span className="text-center text-muted-foreground">Potential</span>
                  <span className="font-medium">{p2.potential}</span>

                  <span className="text-right font-medium">{p1.fatigue}%</span>
                  <span className="text-center text-muted-foreground">Fatigue</span>
                  <span className="font-medium">{p2.fatigue}%</span>

                  <span className="text-right font-medium">{p1.contractMatchesRemaining}</span>
                  <span className="text-center text-muted-foreground">Contract</span>
                  <span className="font-medium">{p2.contractMatchesRemaining}</span>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <p className="py-12 text-center text-muted-foreground">Select two players to compare</p>
        )}
      </div>
    </AppLayout>
  )
}
