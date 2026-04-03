import { Link, useRouterState } from '@tanstack/react-router'
import {
  Home,
  Users,
  Swords,
  ClipboardList,
  Trophy,
  Wallet,
  ArrowLeftRight,
  Dumbbell,
  BarChart3,
  Settings,
} from 'lucide-react'
import { cn } from '~/lib/utils'

const NAV_ITEMS: Array<{ to: string; label: string; icon: typeof Home }> = [
  { to: '/dashboard', label: 'Dashboard', icon: Home },
  { to: '/squad', label: 'Squad', icon: Users },
  { to: '/matches', label: 'Matches', icon: Swords },
  { to: '/tactics', label: 'Tactics', icon: ClipboardList },
  { to: '/competition', label: 'Competition', icon: Trophy },
  { to: '/finances', label: 'Finances', icon: Wallet },
  { to: '/transfers', label: 'Transfers', icon: ArrowLeftRight },
  { to: '/training', label: 'Training', icon: Dumbbell },
  { to: '/stats', label: 'Statistics', icon: BarChart3 },
]

const BOTTOM_ITEMS: Array<{ to: string; label: string; icon: typeof Home }> = [
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname

  return (
    <aside className="hidden w-56 shrink-0 border-r border-border bg-sidebar lg:flex lg:flex-col">
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = currentPath === item.to || currentPath.startsWith(`${item.to}/`)

          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}

        <div className="mt-auto">
          {BOTTOM_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = currentPath === item.to

            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground',
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>
    </aside>
  )
}
