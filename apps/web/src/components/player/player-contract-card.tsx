import type { Player } from '@regista/shared'

function formatSalary(cents: number): string {
  const v = cents / 100
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1)
  if (v >= 1_000) return v.toLocaleString('en-US', { maximumFractionDigits: 0 })
  return v.toFixed(0)
}

function formatClause(cents: number): string {
  const v = cents / 100
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1)
  return v.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

interface PlayerContractCardProps {
  player: Player
}

export function PlayerContractCard({ player }: PlayerContractCardProps) {
  const salaryFormatted = formatSalary(player.weeklySalary)
  const clauseFormatted = formatClause(player.releaseClause)
  const clauseUnit = player.releaseClause / 100 >= 1_000_000 ? 'M G$' : 'G$'
  const salaryUnit = 'G$/week'

  return (
    <div className="flex flex-col gap-6 rounded-3xl bg-surface p-6">
      <h3 className="font-heading text-sm font-normal uppercase tracking-[1.4px] text-[#bdcabc]">
        Contract
      </h3>

      <div className="flex flex-col gap-4">
        {/* Duration */}
        <div className="flex items-center justify-between">
          <span className="font-body text-sm text-[#bdcabc]">Duration</span>
          <span>
            <span className="font-display text-lg font-bold text-[rgba(210,232,214,0.9)]">
              {player.contractMatchesRemaining}{' '}
            </span>
            <span className="font-body text-xs font-bold text-[#bdcabc]">matches remaining</span>
          </span>
        </div>

        {/* Weekly Salary */}
        <div className="flex items-center justify-between">
          <span className="font-body text-sm text-[#bdcabc]">Weekly Salary</span>
          <span>
            <span className="font-display text-lg font-bold text-[rgba(210,232,214,0.9)]">
              {salaryFormatted}{' '}
            </span>
            <span className="font-body text-xs font-bold text-[#bdcabc]">{salaryUnit}</span>
          </span>
        </div>

        {/* Release Clause */}
        <div className="flex items-center justify-between border-t border-[rgba(62,74,63,0.1)] pt-4">
          <span className="font-body text-sm text-[#bdcabc]">Release Clause</span>
          <span>
            <span className="font-display text-lg font-bold text-[rgba(210,232,214,0.9)]">
              {clauseFormatted}{' '}
            </span>
            <span className="font-body text-xs font-bold text-[#bdcabc]">{clauseUnit}</span>
          </span>
        </div>
      </div>
    </div>
  )
}
