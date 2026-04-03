import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useAuth } from '~/hooks/use-auth'
import { AppLayout } from '~/components/layout/app-layout'
import { StandingsTable } from '~/components/competition/standings-table'
import { fetchStandings } from '~/lib/competition'
import { Trophy } from 'lucide-react'

export const Route = createFileRoute('/competition')({
  component: CompetitionPage,
})

function CompetitionPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({ to: '/login' })
    }
  }, [isAuthenticated, isLoading, navigate])

  const { data, isPending } = useQuery({
    queryKey: ['competition', 'standings'],
    queryFn: fetchStandings,
    enabled: isAuthenticated && !isLoading,
  })

  if (isLoading || !isAuthenticated) return null

  return (
    <AppLayout>
      <div className="space-y-6">
        {data && (
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{data.division.name}</h1>
              <p className="text-sm text-muted-foreground">
                {data.league.name} — Season {data.season.number} — Matchday {data.season.currentMatchday}/{data.season.totalMatchdays}
              </p>
            </div>
            <Trophy className="h-6 w-6 text-muted-foreground" />
          </div>
        )}

        {isPending ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : data ? (
          <>
            {/* Zone legend */}
            <div className="flex gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="h-3 w-1 rounded bg-amber-500" /> Champion
              </div>
              <div className="flex items-center gap-1">
                <div className="h-3 w-1 rounded bg-emerald-500" /> Promotion
              </div>
              <div className="flex items-center gap-1">
                <div className="h-3 w-1 rounded bg-red-500" /> Relegation
              </div>
            </div>

            <StandingsTable standings={data.standings} />
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
            <Trophy className="h-12 w-12 opacity-30" />
            <p>No competition data available</p>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
