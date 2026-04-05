import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useAuth } from '~/hooks/use-auth'
import { AppLayout } from '~/components/layout/app-layout'
import { fetchPlayerDetail, fetchPlayerHistory, extendContract } from '~/lib/squad'
import { PlayerHero } from '~/components/player/player-hero'
import { PlayerTacticalOverview } from '~/components/player/player-tactical-overview'
import { PlayerContractCard } from '~/components/player/player-contract-card'
import { PlayerConditionCard } from '~/components/player/player-condition-card'
import { PlayerRecentPerformances } from '~/components/player/player-recent-performances'
import { PlayerProgressionChart } from '~/components/player/player-progression-chart'
import { PlayerStatCategory } from '~/components/player/player-stat-category'
import { FootballLoader } from '~/components/ui/football-loader'
import { Zap, Target, Brain, Shield, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export const Route = createFileRoute('/player/$playerId')({
  component: PlayerDetailPage,
})

function formatPrice(cents: number): string {
  const v = cents / 100
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`
  return v.toFixed(0)
}

function PlayerDetailPage() {
  const { playerId } = Route.useParams()
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [renewOpen, setRenewOpen] = useState(false)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate({ to: '/login' })
  }, [isAuthenticated, isLoading, navigate])

  const { data, isPending } = useQuery({
    queryKey: ['squad', playerId],
    queryFn: () => fetchPlayerDetail(playerId),
    enabled: isAuthenticated && !isLoading,
  })

  const { data: historyData } = useQuery({
    queryKey: ['squad', playerId, 'history'],
    queryFn: () => fetchPlayerHistory(playerId),
    enabled: isAuthenticated && !isLoading,
  })

  const renewMutation = useMutation({
    mutationFn: () => extendContract(playerId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['squad', playerId] })
      setRenewOpen(false)
      toast.success(`Contract extended! Signing bonus: ${formatPrice(res.signingBonus)} G$`)
    },
    onError: (err: any) => toast.error(err.message),
  })

  if (isLoading || !isAuthenticated) return null

  if (isPending) {
    return (
      <AppLayout>
        <div className="flex justify-center py-20">
          <FootballLoader size="lg" text="Loading player..." />
        </div>
      </AppLayout>
    )
  }

  if (!data) return null

  const { player, stats, goalkeeperStats: gkStats, marketValue } = data
  const performances = historyData?.performances ?? []
  const overallHistory = historyData?.overallHistory ?? []
  const isGK = player.position === 'GK'

  return (
    <AppLayout>
      <div className="flex flex-col gap-8 fade-in pb-16">
        {/* Hero Section */}
        <PlayerHero
          player={player}
          marketValue={marketValue}
          onRenew={() => setRenewOpen(true)}
          onListTransfer={() => navigate({ to: '/transfers' })}
        />

        {/* Main Grid: 2 columns */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Left Column */}
          <div className="flex flex-col">
            <PlayerTacticalOverview
              stats={stats}
              goalkeeperStats={gkStats}
              isGK={isGK}
            />

            <div className="grid grid-cols-1 gap-8 pt-8 sm:grid-cols-2">
              <PlayerContractCard player={player} />
              <PlayerConditionCard player={player} />
            </div>
          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-8">
            <PlayerRecentPerformances performances={performances} />
            <PlayerProgressionChart overallHistory={overallHistory} player={player} />
          </div>
        </div>

        {/* Detailed Stats Grid: 4 columns */}
        {stats && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
            <PlayerStatCategory
              title="Physical"
              icon={Zap}
              stats={[
                { label: 'Pace', value: stats.pace },
                { label: 'Stamina', value: stats.stamina },
                { label: 'Strength', value: stats.strength },
                { label: 'Agility', value: stats.agility },
              ]}
            />
            <PlayerStatCategory
              title="Technical"
              icon={Target}
              stats={[
                { label: 'Passing', value: stats.passing },
                { label: 'Shooting', value: stats.shooting },
                { label: 'Dribbling', value: stats.dribbling },
                { label: 'Crossing', value: stats.crossing },
              ]}
            />
            <PlayerStatCategory
              title="Mental"
              icon={Brain}
              stats={[
                { label: 'Vision', value: stats.vision },
                { label: 'Composure', value: stats.composure },
                { label: 'Work Rate', value: stats.workRate },
                { label: 'Positioning', value: stats.positioning },
              ]}
            />
            <PlayerStatCategory
              title="Defense"
              icon={Shield}
              stats={[
                { label: 'Tackling', value: stats.tackling },
                { label: 'Marking', value: stats.marking },
                { label: 'Penalties', value: stats.penalties },
                { label: 'Free Kick', value: stats.freeKick },
              ]}
            />
          </div>
        )}

        {/* GK Stats */}
        {gkStats && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            <PlayerStatCategory
              title="Goalkeeper"
              icon={Shield}
              stats={[
                { label: 'Reflexes', value: gkStats.reflexes },
                { label: 'Diving', value: gkStats.diving },
                { label: 'Handling', value: gkStats.handling },
                { label: 'Positioning', value: gkStats.positioning },
              ]}
            />
            <PlayerStatCategory
              title="Distribution"
              icon={Target}
              stats={[
                { label: 'Kicking', value: gkStats.kicking },
                { label: 'Communication', value: gkStats.communication },
                { label: 'Penalties', value: gkStats.penalties },
                { label: 'Free Kick', value: gkStats.freeKick },
              ]}
            />
          </div>
        )}
      </div>

      {/* Contract Renewal Dialog */}
      {renewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-[rgba(113,220,146,0.2)] bg-[rgba(13,31,20,0.95)] p-8 shadow-2xl">
            <h2 className="font-heading text-xl font-bold uppercase tracking-[1px] text-text-primary">
              Renew Contract
            </h2>
            <p className="mt-1 font-body text-sm text-[#bdcabc]">
              {player.firstName} {player.lastName}
            </p>

            <div className="mt-6 space-y-4">
              {/* Current */}
              <div className="rounded-2xl bg-[rgba(38,57,44,0.3)] p-4">
                <p className="font-body text-xs font-bold uppercase tracking-[1px] text-[#889488]">Current</p>
                <div className="mt-2 space-y-1">
                  <p className="font-body text-sm text-[#bdcabc]">
                    Duration: <span className="font-display font-bold text-text-primary">{player.contractMatchesRemaining} matches</span>
                  </p>
                  <p className="font-body text-sm text-[#bdcabc]">
                    Salary: <span className="font-display font-bold text-text-primary">{formatPrice(player.weeklySalary)} G$/week</span>
                  </p>
                </div>
              </div>

              {/* New terms */}
              <div className="rounded-2xl border border-[rgba(113,220,146,0.15)] bg-[rgba(113,220,146,0.05)] p-4">
                <p className="font-body text-xs font-bold uppercase tracking-[1px] text-pelouse-light">New Terms</p>
                <div className="mt-2 space-y-1">
                  <p className="font-body text-sm text-[#bdcabc]">
                    Extension: <span className="font-display font-bold text-pelouse-light">+20 matches</span>
                  </p>
                  <p className="font-body text-sm text-[#bdcabc]">
                    New salary: <span className="font-display font-bold text-text-primary">~{formatPrice(player.overall * 500 * 100)} G$/week</span>
                  </p>
                  <p className="font-body text-sm text-[#bdcabc]">
                    Signing bonus: <span className="font-display font-bold text-[#facc15]">{formatPrice(player.overall * 10_000)} G$</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3 justify-end">
              <button
                onClick={() => setRenewOpen(false)}
                className="rounded-2xl border border-[rgba(62,74,63,0.3)] px-5 py-2.5 font-heading text-sm font-bold uppercase tracking-[0.8px] text-[#bdcabc] transition-colors hover:bg-[rgba(62,74,63,0.2)]"
              >
                Cancel
              </button>
              <button
                onClick={() => renewMutation.mutate()}
                disabled={renewMutation.isPending}
                className="flex items-center gap-2 rounded-2xl bg-regista-green px-5 py-2.5 font-heading text-sm font-bold uppercase tracking-[0.8px] text-[#00391a] transition-colors hover:bg-pelouse disabled:opacity-50"
              >
                {renewMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Renew Contract
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
