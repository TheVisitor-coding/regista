import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useAuth } from '~/hooks/use-auth'
import { useClub } from '~/hooks/use-club'
import { AppLayout } from '~/components/layout/app-layout'
import { MatchCard } from '~/components/matches/match-card'
import { fetchMatches } from '~/lib/matches'
import { Button } from '~/components/ui/button'
import { Swords } from 'lucide-react'

export const Route = createFileRoute('/matches')({
  component: MatchesPage,
})

type MatchFilter = 'upcoming' | 'past' | 'all'

function MatchesPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const { club } = useClub()
  const navigate = useNavigate()
  const [filter, setFilter] = useState<MatchFilter>('upcoming')

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({ to: '/login' })
    }
  }, [isAuthenticated, isLoading, navigate])

  const { data, isPending } = useQuery({
    queryKey: ['matches', filter],
    queryFn: () => fetchMatches({ filter, limit: 30 }),
    enabled: isAuthenticated && !isLoading,
  })

  if (isLoading || !isAuthenticated) return null

  const matches = data?.matches ?? []

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Matches</h1>

        <div className="flex gap-2">
          {(['upcoming', 'past', 'all'] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>

        {isPending ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : matches.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
            <Swords className="h-12 w-12 opacity-30" />
            <p>No matches found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {matches.map((match) => (
              <MatchCard key={match.id} match={match} currentClubId={club?.id} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
