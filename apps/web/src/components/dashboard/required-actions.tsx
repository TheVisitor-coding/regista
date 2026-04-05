import { Link } from '@tanstack/react-router'
import { AlertTriangle, FileWarning, Search, TrendingUp, Info, Zap } from 'lucide-react'
import { cn } from '~/lib/utils'
import type { DashboardData } from '@regista/shared'

type QuickAction = DashboardData['quickActions'][number]

const PRIORITY_BORDER: Record<string, string> = {
  critical: 'border-l-loss',
  warning: 'border-l-loss',
  important: 'border-l-[#f3632d]',
  info: 'border-l-pelouse-light',
  positive: 'border-l-pelouse-light',
}

const PRIORITY_ICON: Record<string, typeof AlertTriangle> = {
  critical: AlertTriangle,
  warning: Zap,
  important: FileWarning,
  info: Info,
  positive: TrendingUp,
}

interface RequiredActionsProps {
  actions: QuickAction[]
}

export function RequiredActions({ actions }: RequiredActionsProps) {
  return (
    <div
      className="flex flex-col gap-6 rounded-2xl border border-[rgba(255,255,255,0.05)] p-6"
      style={{
        background: 'linear-gradient(137deg, #112318 0%, #112318 50%, #2b1f0d 100%)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-xl font-bold uppercase tracking-tight text-text-primary">
          Required Actions
        </h3>
        {actions.length > 0 && (
          <span className="rounded-full bg-orange px-2 py-1 text-[10px] font-bold uppercase text-white">
            {actions.length} Pending
          </span>
        )}
      </div>

      {/* Action items */}
      <div className="flex flex-col gap-3">
        {actions.slice(0, 4).map((action, i) => {
          const Icon = PRIORITY_ICON[action.priority] ?? Info
          const borderClass = PRIORITY_BORDER[action.priority] ?? 'border-l-pelouse-light'

          const content = (
            <div
              className={cn(
                'flex items-center gap-4 rounded-2xl border-l-4 bg-[rgba(28,46,34,0.8)] px-5 py-4',
                borderClass,
              )}
            >
              <Icon className="h-5 w-5 shrink-0 text-text-secondary" />
              <div className="min-w-0">
                <p className="truncate font-body text-sm font-bold text-text-primary">
                  {action.message.split('.')[0]}
                </p>
                {action.message.includes('.') && (
                  <p className="truncate font-body text-xs text-text-secondary">
                    {action.message.split('.').slice(1).join('.').trim()}
                  </p>
                )}
              </div>
            </div>
          )

          if (action.actionUrl) {
            return (
              <Link key={i} to={action.actionUrl} className="transition-transform hover:scale-[1.01]">
                {content}
              </Link>
            )
          }
          return <div key={i}>{content}</div>
        })}
      </div>
    </div>
  )
}
