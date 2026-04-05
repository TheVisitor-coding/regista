import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useAuth } from '~/hooks/use-auth'
import { useClub } from '~/hooks/use-club'
import { AppLayout } from '~/components/layout/app-layout'
import { MatchCard } from '~/components/matches/match-card'
import { fetchMatchday } from '~/lib/competition'
import { Button } from '~/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export const Route = createFileRoute('/matchday/$number')({
  component: MatchdayPage,
})

function MatchdayPage() {
  const { number } = Route.useParams()
  const { isAuthenticated, isLoading } = useAuth()
  const { club } = useClub()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({ to: '/login' })
    }
  }, [isAuthenticated, isLoading, navigate])

  const { data, isPending } = useQuery({
    queryKey: ['matchday', number],
    queryFn: () => fetchMatchday(Number(number)),
    enabled: isAuthenticated && !isLoading,
  })

  if (isLoading || !isAuthenticated) return null

  return (
    <AppLayout>
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/competition' })}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to standings
        </Button>

        <h1 className="text-2xl font-bold">Matchday {number}</h1>

        {isPending ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-2">
            {(data?.matches ?? []).map((match) => (
              <MatchCard key={match.id} match={match} currentClubId={club?.id} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
