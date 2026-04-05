import { Link, useRouterState, useNavigate } from '@tanstack/react-router'
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
  HelpCircle,
  LogOut,
} from 'lucide-react'
import { cn } from '~/lib/utils'
import { useClub } from '~/hooks/use-club'
import { useAuth } from '~/hooks/use-auth'

const NAV_ITEMS: Array<{ to: string; label: string; icon: typeof Home }> = [
  { to: '/dashboard', label: 'Dashboard', icon: Home },
  { to: '/squad', label: 'Squad', icon: Users },
  { to: '/tactics', label: 'Tactics', icon: ClipboardList },
  { to: '/matches', label: 'Matches', icon: Swords },
  { to: '/competition', label: 'League', icon: Trophy },
  { to: '/transfers', label: 'Transfers', icon: ArrowLeftRight },
  { to: '/training', label: 'Training', icon: Dumbbell },
  { to: '/finances', label: 'Finance', icon: Wallet },
  { to: '/stats', label: 'Stats', icon: BarChart3 },
]

export function Sidebar() {
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname
  const { club } = useClub()
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate({ to: '/' })
  }

  return (
    <aside className="group/sidebar hidden lg:flex fixed left-0 top-0 z-50 h-screen w-20 hover:w-64 flex-col items-stretch overflow-hidden bg-[rgba(5,23,12,0.6)] backdrop-blur-[12px] shadow-[4px_0_24px_rgba(5,23,12,0.5)] hover:shadow-[24px_0_48px_rgba(5,23,12,0.4)] hover:border-r hover:border-[rgba(38,57,44,0.15)] hover:rounded-r-3xl transition-all duration-200 ease-out py-3">
      {/* Collapsed: Logo "R" — visible only when not hovered */}
      <div className="flex items-center justify-center shrink-0 group-hover/sidebar:hidden py-4">
        <Link to="/dashboard">
          <div className="flex h-[65px] w-[65px] items-center justify-center rounded-[14px] bg-gradient-to-br from-[#1B6F3E] to-[#2E9E5B]">
            <span className="font-display text-[22px] font-bold tracking-wider text-[#EAFFD4]">R</span>
          </div>
        </Link>
      </div>

      {/* Expanded: Club avatar + name — visible only when hovered */}
      <div className="hidden group-hover/sidebar:flex flex-col items-center gap-2 px-8 py-4 shrink-0">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[rgba(113,220,146,0.2)] bg-surface-light overflow-hidden">
          <span className="font-display text-2xl font-bold text-pelouse-light opacity-50">
            {club?.name?.charAt(0) ?? 'R'}
          </span>
        </div>
        <div className="pt-2 text-center">
          <p className="font-heading text-lg font-bold tracking-[1.8px] text-pelouse-light">
            {club?.name?.toUpperCase() ?? 'MY CLUB'}
          </p>
          <p className="font-heading text-[10px] tracking-[2px] uppercase text-[#889488]">
            Premier Division
          </p>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex flex-1 flex-col gap-1 pt-4 group-hover/sidebar:pt-4">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = currentPath === item.to || currentPath.startsWith(`${item.to}/`)

          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'flex items-center gap-4 py-3 transition-all',
                // Collapsed: center icon
                'justify-center group-hover/sidebar:justify-start group-hover/sidebar:pl-7',
                isActive
                  ? 'border-l-4 border-pelouse bg-gradient-to-r from-[rgba(46,158,91,0.1)] to-transparent'
                  : 'border-l-4 border-transparent',
              )}
            >
              <Icon
                className={cn(
                  'h-5 w-5 shrink-0 transition-colors',
                  isActive ? 'text-pelouse-light' : 'text-[#26392c] group-hover/sidebar:text-[#26392c]',
                )}
              />
              <span
                className={cn(
                  'hidden group-hover/sidebar:block font-heading text-sm font-medium uppercase tracking-[0.7px] whitespace-nowrap transition-colors',
                  isActive ? 'text-pelouse-light' : 'text-[#26392c]',
                )}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* Bottom: Next Match button + Help/Logout (expanded only) */}
      <div className="hidden group-hover/sidebar:flex flex-col gap-4 px-6 pb-8 shrink-0">
        <Link
          to="/tactics"
          className="flex items-center justify-center gap-2 rounded-xl py-3 font-heading text-base font-bold uppercase tracking-tight text-[#00391a]"
          style={{ background: 'linear-gradient(167deg, #71dc92 0%, #35a460 100%)' }}
        >
          <Swords className="h-4 w-4" />
          Next Match
        </Link>

        <div className="border-t border-[rgba(62,74,63,0.2)] pt-4 flex flex-col gap-2">
          <Link
            to="/settings"
            className="flex items-center gap-4 pl-2 py-1 font-heading text-xs uppercase tracking-[1.2px] text-[#26392c] hover:text-text-secondary transition-colors"
          >
            <HelpCircle className="h-4 w-4" />
            Help
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-4 pl-2 py-1 font-heading text-xs uppercase tracking-[1.2px] text-[#26392c] hover:text-text-secondary transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Logout
          </button>
        </div>
      </div>

      {/* Collapsed: Settings gear */}
      <div className="flex group-hover/sidebar:hidden items-center justify-center py-4 shrink-0">
        <Link to="/settings">
          <Settings className="h-5 w-5 text-[rgba(209,250,229,0.5)] transition-colors hover:text-[rgba(209,250,229,0.8)]" />
        </Link>
      </div>
    </aside>
  )
}
