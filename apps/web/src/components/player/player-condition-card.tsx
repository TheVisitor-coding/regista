import type { Player } from '@regista/shared'
import { cn } from '~/lib/utils'

interface PlayerConditionCardProps {
  player: Player
}

function getConditionMessage(fatigue: number, isInjured: boolean, isSuspended: boolean): string {
  if (isInjured) return 'Player is currently injured'
  if (isSuspended) return 'Player is currently suspended'
  if (fatigue > 70) return 'Player is heavily fatigued — consider rest'
  if (fatigue > 30) return 'Player has moderate fatigue levels'
  return 'Player is well-rested and ready'
}

function getFatigueBarColor(fatigue: number): string {
  if (fatigue >= 70) return 'bg-[#ef4444]'
  if (fatigue >= 40) return 'bg-[#f97316]'
  return 'bg-[#ef4444]'
}

function getFitnessBarColor(fitness: number): string {
  if (fitness >= 70) return 'bg-[#71dc92]'
  if (fitness >= 40) return 'bg-[#facc15]'
  return 'bg-[#ef4444]'
}

export function PlayerConditionCard({ player }: PlayerConditionCardProps) {
  const fitness = 100 - player.fatigue
  const message = getConditionMessage(player.fatigue, player.isInjured, player.isSuspended)
  const isPositive = !player.isInjured && !player.isSuspended && player.fatigue <= 30

  return (
    <div className="flex flex-col gap-6 rounded-3xl bg-surface p-6">
      <h3 className="font-heading text-sm font-normal uppercase tracking-[1.4px] text-[#bdcabc]">
        Condition
      </h3>

      <div className="flex flex-col gap-6">
        {/* Fatigue */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-body text-xs font-bold uppercase text-[#bdcabc]">Fatigue</span>
            <span className="font-display text-sm font-bold text-text-primary">{player.fatigue}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[#26392c]">
            <div
              className={cn('h-full rounded-full transition-all', getFatigueBarColor(player.fatigue))}
              style={{ width: `${player.fatigue}%` }}
            />
          </div>
        </div>

        {/* Fitness */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-body text-xs font-bold uppercase text-[#bdcabc]">Fitness</span>
            <span className="font-display text-sm font-bold text-text-primary">{fitness}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[#26392c]">
            <div
              className={cn('h-full rounded-full transition-all', getFitnessBarColor(fitness))}
              style={{ width: `${fitness}%` }}
            />
          </div>
        </div>

        {/* Status message */}
        <p className={cn(
          'font-body text-xs font-medium italic',
          isPositive ? 'text-[rgba(16,185,129,0.7)]' : 'text-[rgba(239,68,68,0.7)]',
        )}>
          {message}
        </p>
      </div>
    </div>
  )
}
