import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useAuth } from '~/hooks/use-auth'
import { AppLayout } from '~/components/layout/app-layout'
import { fetchMatch } from '~/lib/matches'
import { fetchMatchEvents, fetchMatchStats } from '~/lib/match-detail'
import { EventTimeline } from '~/components/match/event-timeline'
import { MatchStatsBar } from '~/components/match/match-stats-bar'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export const Route = createFileRoute('/matches/$matchId')({
  component: MatchDetailPage,
})

function MatchDetailPage() {
  const { matchId } = Route.useParams()
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({ to: '/login' })
    }
  }, [isAuthenticated, isLoading, navigate])

  const { data: matchData, isPending: matchPending } = useQuery({
    queryKey: ['match', matchId],
    queryFn: () => fetchMatch(matchId),
    enabled: isAuthenticated && !isLoading,
    refetchInterval: (query) => {
      const match = query.state.data?.match
      return match?.status === 'live' ? 5000 : false
    },
  })

  const { data: eventsData } = useQuery({
    queryKey: ['match', matchId, 'events'],
    queryFn: () => fetchMatchEvents(matchId),
    enabled: isAuthenticated && !isLoading && !!matchData,
    refetchInterval: matchData?.match?.status === 'live' ? 3000 : false,
  })

  const { data: statsData } = useQuery({
    queryKey: ['match', matchId, 'stats'],
    queryFn: () => fetchMatchStats(matchId),
    enabled: isAuthenticated && !isLoading && matchData?.match?.status === 'finished',
  })

  if (isLoading || !isAuthenticated) return null

  const match = matchData?.match
  const events = eventsData?.events ?? []
  const stats = statsData?.stats ?? []

  return (
    <AppLayout>
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/matches' })}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to matches
        </Button>

        {matchPending ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : match ? (
          <>
            {/* Score header */}
            <Card>
              <CardContent className="p-6">
                <p className="mb-4 text-center text-xs text-muted-foreground">
                  Matchday {match.matchday} — {new Date(match.scheduledAt).toLocaleString()}
                  {match.status === 'live' && (
                    <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 text-red-500">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" /> LIVE
                    </span>
                  )}
                </p>

                <div className="flex items-center justify-center gap-8">
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className="h-12 w-12 rounded-full"
                      style={{ backgroundColor: match.homeClub.primaryColor }}
                    />
                    <p className="text-sm font-semibold">{match.homeClub.name}</p>
                    <span className="text-[10px] text-muted-foreground">HOME</span>
                  </div>

                  <div className="text-center">
                    {match.status === 'finished' || match.status === 'live' ? (
                      <p className="text-4xl font-bold">
                        {match.homeScore ?? 0} - {match.awayScore ?? 0}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">vs</p>
                    )}
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <div
                      className="h-12 w-12 rounded-full"
                      style={{ backgroundColor: match.awayClub.primaryColor }}
                    />
                    <p className="text-sm font-semibold">{match.awayClub.name}</p>
                    <span className="text-[10px] text-muted-foreground">AWAY</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Events */}
            {events.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Match Events</CardTitle>
                </CardHeader>
                <CardContent>
                  <EventTimeline events={events} homeClubId={match.homeClub.id} />
                </CardContent>
              </Card>
            )}

            {/* Stats */}
            {stats.length === 2 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Match Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <MatchStatsBar
                    homeStats={stats.find((s) => s.clubId === match.homeClub.id) ?? null}
                    awayStats={stats.find((s) => s.clubId === match.awayClub.id) ?? null}
                  />
                </CardContent>
              </Card>
            )}
          </>
        ) : null}
      </div>
    </AppLayout>
  )
}
