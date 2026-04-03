import type { MatchEvent } from '@regista/shared'
import { cn } from '~/lib/utils'

interface EventTimelineProps {
  events: MatchEvent[]
  homeClubId?: string
}

const EVENT_ICONS: Record<string, string> = {
  goal: '⚽',
  shot_on_target: '🎯',
  shot_off_target: '💨',
  foul: '⚠️',
  yellow_card: '🟨',
  red_card: '🟥',
  injury: '🏥',
  substitution: '🔄',
  corner: '📐',
  penalty: '⚡',
  save: '🧤',
  half_time_start: '⏸️',
  half_time_end: '▶️',
  full_time: '🏁',
  kick_off: '🏁',
}

const NOTABLE_EVENTS = ['goal', 'yellow_card', 'red_card', 'injury', 'substitution', 'penalty', 'half_time_start', 'full_time', 'kick_off']

export function EventTimeline({ events, homeClubId }: EventTimelineProps) {
  const notable = events.filter((e) => NOTABLE_EVENTS.includes(e.type))

  if (notable.length === 0) {
    return <p className="py-4 text-center text-sm text-muted-foreground">No events yet</p>
  }

  return (
    <div className="space-y-1">
      {[...notable].reverse().map((event, i) => {
        const isHome = event.clubId === homeClubId
        const icon = EVENT_ICONS[event.type] ?? '•'

        return (
          <div
            key={event.id ?? i}
            className={cn(
              'flex items-center gap-2 rounded px-3 py-1.5 text-sm',
              event.type === 'goal' && 'bg-emerald-500/10 font-semibold',
              event.type === 'red_card' && 'bg-red-500/10',
            )}
          >
            <span className="w-8 text-right text-xs text-muted-foreground">{event.minute}'</span>
            <span>{icon}</span>
            <span className={cn(
              'flex-1',
              isHome ? 'text-left' : 'text-right',
            )}>
              {event.type.replace(/_/g, ' ')}
            </span>
          </div>
        )
      })}
    </div>
  )
}
