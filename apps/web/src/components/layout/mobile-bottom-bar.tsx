import { Link, useRouterState } from '@tanstack/react-router'
import { Home, Users, Swords, ClipboardList, Trophy } from 'lucide-react'
import { cn } from '~/lib/utils'

const MOBILE_NAV_ITEMS = [
  { to: '/dashboard', label: 'Home', icon: Home },
  { to: '/squad', label: 'Squad', icon: Users },
  { to: '/matches', label: 'Matches', icon: Swords },
  { to: '/tactics', label: 'Tactics', icon: ClipboardList },
  { to: '/competition', label: 'League', icon: Trophy },
] as const

export function MobileBottomBar() {
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[rgba(255,255,255,0.05)] bg-[rgba(5,23,12,0.95)] backdrop-blur-md lg:hidden">
      <div className="flex h-14 items-center justify-around">
        {MOBILE_NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = currentPath === item.to || currentPath.startsWith(`${item.to}/`)

          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1 font-heading text-[10px] uppercase tracking-[0.5px] transition-colors',
                isActive
                  ? 'text-pelouse'
                  : 'text-[rgba(209,250,229,0.5)]',
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
