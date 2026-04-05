import type { LucideIcon } from 'lucide-react'
import { cn } from '~/lib/utils'

interface StatEntry {
  label: string
  value: number
}

interface PlayerStatCategoryProps {
  title: string
  icon: LucideIcon
  stats: StatEntry[]
}

function getStatBarColor(value: number): string {
  if (value >= 80) return 'bg-pelouse-light'
  if (value >= 70) return 'bg-[#54df89]'
  if (value >= 60) return 'bg-[#35a460]'
  return 'bg-[#ffb4ab]'
}

export function PlayerStatCategory({ title, icon: Icon, stats }: PlayerStatCategoryProps) {
  return (
    <div className="flex flex-col gap-6 rounded-3xl bg-surface p-6">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-[rgba(62,74,63,0.1)] pb-4">
        <Icon className="size-5 text-[#bdcabc]" />
        <span className="font-heading text-base font-bold uppercase tracking-[1.6px] text-text-primary">
          {title}
        </span>
      </div>

      {/* Stat bars */}
      <div className="flex flex-col gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="font-body text-xs text-[#bdcabc]">{stat.label}</span>
              <span className="font-body text-xs font-bold text-text-primary">{Math.round(stat.value)}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#26392c]">
              <div
                className={cn('h-full rounded-full transition-all', getStatBarColor(stat.value))}
                style={{ width: `${Math.min(stat.value, 99)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
