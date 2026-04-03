import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useAuth } from '~/hooks/use-auth'
import { AppLayout } from '~/components/layout/app-layout'
import { MarketPlayerCard } from '~/components/transfers/market-player-card'
import {
  fetchMarket,
  fetchFreeAgents,
  fetchSentOffers,
  fetchReceivedOffers,
  buyListing,
  signFreeAgent,
  acceptOffer,
  rejectOffer,
  cancelOffer,
} from '~/lib/transfers'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Card, CardContent } from '~/components/ui/card'
import { ArrowLeftRight, Users, ShoppingBag } from 'lucide-react'
import { cn } from '~/lib/utils'

export const Route = createFileRoute('/transfers')({
  component: TransfersPage,
})

type Tab = 'market' | 'free-agents' | 'my-transfers'

function TransfersPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<Tab>('market')

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate({ to: '/login' })
  }, [isAuthenticated, isLoading, navigate])

  const { data: marketData, isPending: marketPending } = useQuery({
    queryKey: ['market'],
    queryFn: () => fetchMarket({ limit: 30 }),
    enabled: isAuthenticated && !isLoading && tab === 'market',
  })

  const { data: freeAgentsData } = useQuery({
    queryKey: ['free-agents'],
    queryFn: fetchFreeAgents,
    enabled: isAuthenticated && !isLoading && tab === 'free-agents',
  })

  const { data: sentData } = useQuery({
    queryKey: ['offers', 'sent'],
    queryFn: fetchSentOffers,
    enabled: isAuthenticated && !isLoading && tab === 'my-transfers',
  })

  const { data: receivedData } = useQuery({
    queryKey: ['offers', 'received'],
    queryFn: fetchReceivedOffers,
    enabled: isAuthenticated && !isLoading && tab === 'my-transfers',
  })

  const buyMutation = useMutation({
    mutationFn: buyListing,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['market'] }),
  })

  const signMutation = useMutation({
    mutationFn: signFreeAgent,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['free-agents'] }),
  })

  const acceptMutation = useMutation({
    mutationFn: acceptOffer,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['offers'] }),
  })

  const rejectMutation = useMutation({
    mutationFn: rejectOffer,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['offers'] }),
  })

  const cancelMutation = useMutation({
    mutationFn: cancelOffer,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['offers'] }),
  })

  if (isLoading || !isAuthenticated) return null

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Transfers</h1>

        {/* Tabs */}
        <div className="flex gap-2">
          {([
            { key: 'market' as Tab, label: 'Market', icon: ShoppingBag },
            { key: 'free-agents' as Tab, label: 'Free Agents', icon: Users },
            { key: 'my-transfers' as Tab, label: 'My Transfers', icon: ArrowLeftRight },
          ]).map((t) => (
            <Button
              key={t.key}
              variant={tab === t.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTab(t.key)}
            >
              <t.icon className="mr-1 h-4 w-4" />
              {t.label}
            </Button>
          ))}
        </div>

        {/* Market Tab */}
        {tab === 'market' && (
          marketPending ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            <div className="space-y-3">
              {(marketData?.listings ?? []).length === 0 ? (
                <p className="py-12 text-center text-muted-foreground">No players available</p>
              ) : (
                (marketData?.listings ?? []).map((listing) => (
                  <MarketPlayerCard
                    key={listing.id}
                    listing={listing}
                    onBuy={(id) => buyMutation.mutate(id)}
                  />
                ))
              )}
            </div>
          )
        )}

        {/* Free Agents Tab */}
        {tab === 'free-agents' && (
          <div className="space-y-3">
            {(freeAgentsData?.freeAgents ?? []).length === 0 ? (
              <p className="py-12 text-center text-muted-foreground">No free agents available</p>
            ) : (
              (freeAgentsData?.freeAgents ?? []).map((fa) => (
                <Card key={fa.id}>
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-lg font-bold">
                      {fa.player?.overall ?? '?'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{fa.player?.firstName} {fa.player?.lastName}</p>
                      <p className="text-xs text-muted-foreground">
                        {fa.player?.position} · Age {fa.player?.age}
                        {fa.penaltyApplied && ' · -2 OVR penalty'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-500">Free</p>
                      <Button size="sm" className="mt-1" onClick={() => signMutation.mutate(fa.id)}>
                        Sign
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* My Transfers Tab */}
        {tab === 'my-transfers' && (
          <div className="space-y-6">
            <div>
              <h2 className="mb-3 text-lg font-semibold">Received Offers</h2>
              {(receivedData?.offers ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No received offers</p>
              ) : (
                <div className="space-y-2">
                  {(receivedData?.offers ?? []).map((offer) => (
                    <Card key={offer.id}>
                      <CardContent className="flex items-center justify-between p-4">
                        <div>
                          <p className="font-medium">{offer.player?.firstName} {offer.player?.lastName}</p>
                          <p className="text-xs text-muted-foreground">
                            From {offer.fromClub?.name} · {(offer.amount / 100).toLocaleString()} G$
                          </p>
                          <Badge variant="outline" className="mt-1 text-[10px]">{offer.status}</Badge>
                        </div>
                        {offer.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => acceptMutation.mutate(offer.id)}>Accept</Button>
                            <Button size="sm" variant="outline" onClick={() => rejectMutation.mutate(offer.id)}>Reject</Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 className="mb-3 text-lg font-semibold">Sent Offers</h2>
              {(sentData?.offers ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No sent offers</p>
              ) : (
                <div className="space-y-2">
                  {(sentData?.offers ?? []).map((offer) => (
                    <Card key={offer.id}>
                      <CardContent className="flex items-center justify-between p-4">
                        <div>
                          <p className="font-medium">{offer.player?.firstName} {offer.player?.lastName}</p>
                          <p className="text-xs text-muted-foreground">
                            {(offer.amount / 100).toLocaleString()} G$
                          </p>
                          <Badge variant="outline" className="mt-1 text-[10px]">{offer.status}</Badge>
                        </div>
                        {offer.status === 'pending' && (
                          <Button size="sm" variant="outline" onClick={() => cancelMutation.mutate(offer.id)}>Cancel</Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
