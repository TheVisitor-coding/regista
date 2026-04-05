import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useAuth } from '~/hooks/use-auth'
import { useClub } from '~/hooks/use-club'
import { AppLayout } from '~/components/layout/app-layout'
import { fetchMatch } from '~/lib/matches'
import { fetchMatchEvents, fetchMatchStats, fetchMatchSummary, updateMatchTactics } from '~/lib/match-detail'
import { EventTimeline } from '~/components/match/event-timeline'
import { MatchStatsBar } from '~/components/match/match-stats-bar'
import { PostMatchSummary } from '~/components/match/post-match-summary'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { cn } from '~/lib/utils'
import { toast } from 'sonner'

export const Route = createFileRoute('/match/$matchId')({
  component: MatchDetailPage,
})

const MENTALITIES = [
  { value: 'ultra_defensive', label: 'U.Def', color: 'bg-blue-900' },
  { value: 'defensive', label: 'Def', color: 'bg-blue-600' },
  { value: 'balanced', label: 'Bal', color: 'bg-zinc-600' },
  { value: 'offensive', label: 'Off', color: 'bg-orange-600' },
  { value: 'ultra_offensive', label: 'U.Off', color: 'bg-red-600' },
]

function MatchDetailPage() {
  const { matchId } = Route.useParams()
  const { isAuthenticated, isLoading } = useAuth()
  const { club } = useClub()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'events' | 'stats' | 'tactics'>('events')

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate({ to: '/login' })
  }, [isAuthenticated, isLoading, navigate])

  const { data: matchData, isPending: matchPending } = useQuery({
    queryKey: ['match', matchId],
    queryFn: () => fetchMatch(matchId),
    enabled: isAuthenticated && !isLoading,
    refetchInterval: (query) => query.state.data?.match?.status === 'live' ? 5000 : false,
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

  const { data: summaryData } = useQuery({
    queryKey: ['match', matchId, 'summary'],
    queryFn: () => fetchMatchSummary(matchId),
    enabled: isAuthenticated && !isLoading && matchData?.match?.status === 'finished',
  })

  const tacticsMutation = useMutation({
    mutationFn: (data: { mentality: string }) => updateMatchTactics(matchId, data as any),
    onSuccess: () => toast.success('Tactics updated'),
    onError: () => toast.error('Failed to update tactics'),
  })

  if (isLoading || !isAuthenticated) return null

  const match = matchData?.match
  const events = eventsData?.events ?? []
  const stats = statsData?.stats ?? []
  const isLive = match?.status === 'live'
  const isFinished = match?.status === 'finished'
  const isMyMatch = club && match && (match.homeClub.id === club.id || match.awayClub.id === club.id)

  return (
    <AppLayout>
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/matches' })}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to matches
        </Button>

        {matchPending ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : match ? (
          <>
            {/* Score header */}
            <Card className={cn(isLive && 'border-red-500/30')}>
              <CardContent className="p-6">
                <p className="mb-1 text-center text-xs text-muted-foreground">
                  Matchday {match.matchday}
                  {isLive && (
                    <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 text-red-400 font-semibold">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" /> LIVE
                    </span>
                  )}
                  {isFinished && <span className="ml-2 text-muted-foreground">FINISHED</span>}
                </p>

                <div className="flex items-center justify-center gap-6 sm:gap-10">
                  {/* Home */}
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className="h-14 w-14 rounded-full shadow-lg"
                      style={{ backgroundColor: match.homeClub.primaryColor }}
                    />
                    <p className="max-w-24 truncate text-center text-xs font-semibold">{match.homeClub.name}</p>
                  </div>

                  {/* Score */}
                  <div className="text-center">
                    {isFinished || isLive ? (
                      <p className={cn(
                        'font-black tracking-wider',
                        isLive ? 'text-5xl animate-pulse' : 'text-5xl',
                      )}>
                        {match.homeScore ?? 0}
                        <span className="mx-2 text-3xl text-muted-foreground">-</span>
                        {match.awayScore ?? 0}
                      </p>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">vs</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(match.scheduledAt).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Away */}
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className="h-14 w-14 rounded-full shadow-lg"
                      style={{ backgroundColor: match.awayClub.primaryColor }}
                    />
                    <p className="max-w-24 truncate text-center text-xs font-semibold">{match.awayClub.name}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Post-match summary (replaces other content when finished) */}
            {isFinished && summaryData ? (
              <PostMatchSummary summary={summaryData} />
            ) : (
              <>
                {/* Tabs */}
                <div className="flex gap-1">
                  {(['events', 'stats', ...(isLive && isMyMatch ? ['tactics'] : [])] as const).map((tab) => (
                    <Button
                      key={tab}
                      variant={activeTab === tab ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveTab(tab as any)}
                    >
                      {tab === 'events' ? 'Events' : tab === 'stats' ? 'Stats' : 'Tactics'}
                    </Button>
                  ))}
                </div>

                {/* Events tab */}
                {activeTab === 'events' && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Match Events</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <EventTimeline
                        events={events}
                        homeClubId={match.homeClub.id}
                        homeColor={match.homeClub.primaryColor}
                        awayColor={match.awayClub.primaryColor}
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Stats tab */}
                {activeTab === 'stats' && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Match Statistics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {stats.length === 2 ? (
                        <MatchStatsBar
                          homeStats={stats.find((s) => s.clubId === match.homeClub.id) ?? null}
                          awayStats={stats.find((s) => s.clubId === match.awayClub.id) ?? null}
                        />
                      ) : (
                        <p className="py-4 text-center text-sm text-muted-foreground">Stats available after match</p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Tactics tab (live only, my match) */}
                {activeTab === 'tactics' && isLive && isMyMatch && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Tactical Changes</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-xs text-muted-foreground">Change mentality (5-min cooldown between changes)</p>
                      <div className="flex gap-1">
                        {MENTALITIES.map((m) => (
                          <button
                            key={m.value}
                            onClick={() => tacticsMutation.mutate({ mentality: m.value })}
                            disabled={tacticsMutation.isPending}
                            className={cn(
                              'flex-1 rounded-md py-2 text-[10px] font-semibold text-white transition-all',
                              m.color, 'opacity-60 hover:opacity-100',
                            )}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </>
        ) : null}
      </div>
    </AppLayout>
  )
}
