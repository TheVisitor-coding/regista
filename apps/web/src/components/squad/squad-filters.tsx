import { cn } from '~/lib/utils'
import { ChevronDown } from 'lucide-react'

const POSITION_TABS = [
  { value: '', label: 'ALL' },
  { value: 'GK', label: 'GOALKEEPERS' },
  { value: 'DEF', label: 'DEFENDERS' },
  { value: 'MID', label: 'MIDFIELDERS' },
  { value: 'ATT', label: 'ATTACKERS' },
] as const

interface SquadFiltersProps {
  activeFilter: string
  onFilterChange: (line: string) => void
  sortBy: string
  onSortChange: (sort: string) => void
}

export function SquadFilters({ activeFilter, onFilterChange, sortBy, onSortChange }: SquadFiltersProps) {
  return (
    <div className="flex items-center justify-between pt-2">
      {/* Position tabs */}
      <div className="flex items-center rounded-full border border-[rgba(62,74,63,0.1)] bg-surface-light p-1.5">
        {POSITION_TABS.map((tab) => {
          const isActive = activeFilter === tab.value
          return (
            <button
              key={tab.value}
              onClick={() => onFilterChange(tab.value)}
              className={cn(
                'rounded-full px-6 py-2 font-display text-sm font-bold transition-all',
                isActive
                  ? 'bg-regista-green text-[#00391a] shadow-md'
                  : 'text-text-secondary hover:text-text-primary',
              )}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Sort dropdown */}
      <button
        onClick={() => {
          const sorts = ['position', 'overall', 'age', 'name', 'fatigue']
          const idx = sorts.indexOf(sortBy)
          onSortChange(sorts[(idx + 1) % sorts.length])
        }}
        className="flex items-center gap-2 rounded-xl border border-[rgba(62,74,63,0.2)] bg-[rgba(28,46,34,0.5)] px-4 py-2"
      >
        <span className="font-display text-sm font-bold uppercase text-[#889488]">Sort by</span>
        <ChevronDown className="h-3 w-3 text-[#889488]" />
      </button>
    </div>
  )
}
