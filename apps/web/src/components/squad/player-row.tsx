import { cn } from '~/lib/utils'
import type { PlayerListItem } from '@regista/shared'
import { Badge } from '~/components/ui/badge'

interface PlayerRowProps {
  player: PlayerListItem
  onClick?: () => void
}

function statusIndicator(player: PlayerListItem) {
  if (player.isInjured) return { color: 'bg-red-500', label: 'Injured' }
  if (player.isSuspended) return { color: 'bg-red-500', label: 'Suspended' }
  if (player.fatigue > 70) return { color: 'bg-yellow-500', label: 'Fatigued' }
  return { color: 'bg-emerald-500', label: 'Available' }
}

export function PlayerRow({ player, onClick }: PlayerRowProps) {
  const status = statusIndicator(player)

  return (
    <div
      className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-accent/50"
      onClick={onClick}
    >
      <div className={cn('h-2.5 w-2.5 shrink-0 rounded-full', status.color)} />

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">
          {player.firstName} {player.lastName}
        </p>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px]">
            {player.position}
          </Badge>
          <span className="text-xs text-muted-foreground">Age {player.age}</span>
        </div>
      </div>

      <div className="flex items-center gap-4 text-right text-sm">
        <div>
          <p className="font-semibold">{player.overall}</p>
          <p className="text-[10px] text-muted-foreground">OVR</p>
        </div>
        <div className="hidden sm:block">
          <p className={cn(
            player.fatigue > 70 ? 'text-yellow-500' : 'text-muted-foreground',
          )}>
            {player.fatigue}%
          </p>
          <p className="text-[10px] text-muted-foreground">Fatigue</p>
        </div>
      </div>
    </div>
  )
}
