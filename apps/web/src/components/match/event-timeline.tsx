import type { MatchEvent } from '@regista/shared'
import { cn } from '~/lib/utils'

interface EventTimelineProps {
  events: MatchEvent[]
  homeClubId?: string
  homeColor?: string
  awayColor?: string
}

const EVENT_CONFIG: Record<string, { icon: string; label: string; bg?: string }> = {
  goal: { icon: '⚽', label: 'Goal', bg: 'bg-amber-500/10 border-l-amber-500' },
  shot_on_target: { icon: '🎯', label: 'Shot on target' },
  shot_off_target: { icon: '💨', label: 'Shot off target' },
  foul: { icon: '⚠️', label: 'Foul' },
  yellow_card: { icon: '🟨', label: 'Yellow card', bg: 'bg-yellow-500/10 border-l-yellow-500' },
  red_card: { icon: '🟥', label: 'Red card', bg: 'bg-red-500/10 border-l-red-500' },
  injury: { icon: '🏥', label: 'Injury', bg: 'bg-red-500/5 border-l-red-400' },
  substitution: { icon: '🔄', label: 'Substitution', bg: 'bg-blue-500/5 border-l-blue-400' },
  corner: { icon: '📐', label: 'Corner' },
  penalty: { icon: '⚡', label: 'Penalty', bg: 'bg-amber-500/10 border-l-amber-500' },
  save: { icon: '🧤', label: 'Save' },
  half_time_start: { icon: '⏸️', label: 'Half-time' },
  half_time_end: { icon: '▶️', label: 'Second half' },
  full_time: { icon: '🏁', label: 'Full-time' },
  kick_off: { icon: '🏁', label: 'Kick-off' },
}

const NOTABLE_EVENTS = ['goal', 'yellow_card', 'red_card', 'injury', 'substitution', 'penalty', 'half_time_start', 'full_time', 'kick_off']

export function EventTimeline({ events, homeClubId, homeColor, awayColor }: EventTimelineProps) {
  const notable = events.filter((e) => NOTABLE_EVENTS.includes(e.type))

  if (notable.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">No events yet</p>
  }

  return (
    <div className="space-y-1">
      {[...notable].reverse().map((event, i) => {
        const config = EVENT_CONFIG[event.type] ?? { icon: '•', label: event.type }
        const isHome = event.clubId === homeClubId
        const isSystem = !event.clubId || ['half_time_start', 'half_time_end', 'full_time', 'kick_off'].includes(event.type)

        return (
          <div
            key={event.id ?? i}
            className={cn(
              'flex items-center gap-3 rounded-md border-l-2 border-l-transparent px-3 py-2 text-sm transition-colors',
              config.bg,
              !config.bg && 'hover:bg-accent/20',
            )}
          >
            {/* Minute */}
            <span className="w-8 text-right font-mono text-xs text-muted-foreground">
              {event.minute}'
            </span>

            {/* Team indicator */}
            {!isSystem && (
              <div
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: isHome ? (homeColor ?? '#10b981') : (awayColor ?? '#666') }}
              />
            )}
            {isSystem && <div className="h-2 w-2 shrink-0" />}

            {/* Icon */}
            <span className="text-base">{config.icon}</span>

            {/* Label */}
            <span className={cn(
              'flex-1 text-xs',
              event.type === 'goal' && 'font-semibold',
            )}>
              {config.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
