import type { TransferListing } from '@regista/shared'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { ShoppingCart } from 'lucide-react'

interface MarketPlayerCardProps {
  listing: TransferListing
  onBuy: (listingId: string) => void
  isOwn?: boolean
}

function formatPrice(cents: number): string {
  const value = cents / 100
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`
  return value.toFixed(0)
}

export function MarketPlayerCard({ listing, onBuy, isOwn }: MarketPlayerCardProps) {
  const player = listing.player
  if (!player) return null

  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-lg font-bold">
          {player.overall}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-medium">{player.firstName} {player.lastName}</p>
            <Badge variant="outline" className="text-[10px]">{player.position}</Badge>
            {listing.source === 'ai_market' && (
              <Badge variant="secondary" className="text-[10px]">AI</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Age {player.age} · {player.nationality} · Pot. {player.potential}
          </p>
        </div>

        <div className="text-right">
          <p className="text-lg font-bold text-emerald-500">{formatPrice(listing.price)} G$</p>
          {!isOwn && (
            <Button size="sm" className="mt-1" onClick={() => onBuy(listing.id)}>
              <ShoppingCart className="mr-1 h-3 w-3" />
              Buy
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
