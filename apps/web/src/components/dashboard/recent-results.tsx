import { cn } from '~/lib/utils'
import type { DashboardData } from '@regista/shared'

type Result = DashboardData['recentResults'][number]

function FormDots({ results }: { results: Result[] }) {
  return (
    <div className="flex gap-1">
      {results.map((r, i) => (
        <div
          key={i}
          className={cn(
            'h-2 w-2 rounded-full',
            r.result === 'win' && 'bg-pelouse-light',
            r.result === 'draw' && 'bg-text-secondary',
            r.result === 'loss' && 'bg-loss',
          )}
        />
      ))}
    </div>
  )
}

const RESULT_STYLES = {
  win: {
    pill: 'bg-[rgba(46,158,91,0.1)] border border-[rgba(46,158,91,0.2)]',
    text: 'text-pelouse-light',
    letter: 'W',
  },
  draw: {
    pill: 'bg-[rgba(189,202,188,0.2)]',
    text: 'text-text-secondary',
    letter: 'D',
  },
  loss: {
    pill: 'bg-[rgba(255,180,171,0.2)]',
    text: 'text-loss',
    letter: 'L',
  },
}

interface RecentResultsProps {
  results: Result[]
}

export function RecentResults({ results }: RecentResultsProps) {
  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-[rgba(255,255,255,0.05)] bg-surface p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-xl font-bold uppercase tracking-tight text-text-primary">
          Recent Results
        </h3>
        <FormDots results={results} />
      </div>

      {/* Result rows */}
      <div className="flex flex-col gap-3">
        {results.map((r) => {
          const style = RESULT_STYLES[r.result]
          const prefix = r.isHome ? 'vs' : 'at'

          return (
            <div
              key={r.matchId}
              className="grid grid-cols-12 items-center rounded-2xl bg-surface-light p-4"
            >
              <div className="col-span-4">
                <span className="font-heading text-xs font-bold uppercase text-text-secondary">
                  {prefix} {r.opponent}
                </span>
              </div>
              <div className="col-span-4 flex justify-center">
                <div className={cn('rounded px-3 py-0.5', style.pill)}>
                  <span className={cn('font-heading text-lg font-bold', style.text)}>
                    {r.score}
                  </span>
                </div>
              </div>
              <div className="col-span-4 text-right">
                <span className={cn('font-heading text-base font-bold', style.text)}>
                  {style.letter}
                </span>
              </div>
            </div>
          )
        })}

        {results.length === 0 && (
          <p className="py-4 text-center font-body text-sm text-text-secondary">
            No matches played yet
          </p>
        )}
      </div>
    </div>
  )
}
