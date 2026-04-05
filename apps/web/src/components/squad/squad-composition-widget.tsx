import { POSITION_TO_LINE } from '@regista/shared'
import type { PlayerListItem } from '@regista/shared'

interface SquadCompositionWidgetProps {
  players: PlayerListItem[]
}

export function SquadCompositionWidget({ players }: SquadCompositionWidgetProps) {
  if (players.length === 0) return null

  const avgAge = (players.reduce((sum, p) => sum + p.age, 0) / players.length).toFixed(1)

  const attackers = players.filter((p) => POSITION_TO_LINE[p.position] === 'ATT')
  const defenders = players.filter((p) => POSITION_TO_LINE[p.position] === 'DEF')

  const attackAvg = attackers.length > 0
    ? Math.round(attackers.reduce((s, p) => s + p.overall, 0) / attackers.length)
    : 0
  const defenseAvg = defenders.length > 0
    ? Math.round(defenders.reduce((s, p) => s + p.overall, 0) / defenders.length)
    : 0

  // Age bar: 0-40 scale, show ~65% for avg age ~26
  const agePercent = Math.min(100, Math.round((Number(avgAge) / 40) * 100))

  return (
    <div className="fixed bottom-8 right-8 z-40 hidden w-80 flex-col gap-2 rounded-3xl border border-[rgba(113,220,146,0.2)] bg-[rgba(28,46,34,0.8)] p-6 shadow-2xl backdrop-blur-xl xl:flex">
      <div className="absolute -inset-px rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] pointer-events-none" />

      {/* Team Composition */}
      <h4 className="font-heading text-sm font-bold uppercase text-pelouse-light">
        Team Composition
      </h4>

      <div className="flex items-center justify-between pt-2">
        <span className="font-body text-xs text-text-secondary">Average Age</span>
        <span className="font-display text-base font-bold text-text-primary">{avgAge} Years</span>
      </div>

      <div className="h-2 w-full rounded-full bg-[#26392c]">
        <div
          className="h-full rounded-full bg-pelouse-light transition-all"
          style={{ width: `${agePercent}%` }}
        />
      </div>

      {/* Tactical Balance */}
      <h4 className="pt-4 font-heading text-sm font-bold uppercase text-pelouse-light">
        Tactical Balance
      </h4>

      <div className="grid grid-cols-2 gap-4 pb-4 pt-2">
        <div className="flex flex-col rounded-xl border border-[rgba(62,74,63,0.1)] bg-[rgba(5,23,12,0.4)] p-3">
          <span className="font-body text-[10px] uppercase tracking-[1px] text-[#889488]">Attack</span>
          <span className="font-display text-xl font-extrabold text-text-primary">{attackAvg}</span>
        </div>
        <div className="flex flex-col rounded-xl border border-[rgba(62,74,63,0.1)] bg-[rgba(5,23,12,0.4)] p-3">
          <span className="font-body text-[10px] uppercase tracking-[1px] text-[#889488]">Defense</span>
          <span className="font-display text-xl font-extrabold text-text-primary">{defenseAvg}</span>
        </div>
      </div>

      <button className="rounded-xl border border-[rgba(113,220,146,0.3)] bg-[rgba(53,164,96,0.2)] py-3 font-heading text-xs font-bold uppercase tracking-[1.2px] text-pelouse-light transition-colors hover:bg-[rgba(53,164,96,0.3)]">
        Squad Report
      </button>
    </div>
  )
}
