interface SeasonProgressBarProps {
  currentMatchday: number
  totalMatchdays: number
}

export function SeasonProgressBar({ currentMatchday, totalMatchdays }: SeasonProgressBarProps) {
  const percent = Math.round((currentMatchday / totalMatchdays) * 100)
  const remaining = totalMatchdays - currentMatchday

  return (
    <div className="flex items-center gap-8 rounded-2xl border border-[rgba(255,255,255,0.05)] bg-[rgba(13,31,20,0.6)] px-5 py-4">
      <span className="shrink-0 font-display text-sm font-bold text-white">
        Matchday {currentMatchday} of {totalMatchdays}
      </span>

      <div className="h-2 flex-1 rounded-full bg-[#26392c]">
        <div
          className="h-full rounded-full bg-pelouse-light shadow-[0_0_10px_rgba(113,220,146,0.3)] transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>

      <span className="shrink-0 font-body text-xs italic text-text-secondary">
        {currentMatchday} matches played · {remaining} remaining
      </span>
    </div>
  )
}
