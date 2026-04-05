import { Link, useNavigate } from '@tanstack/react-router'
import { Bell, Smile, Users, Wallet, LogOut, Settings, User } from 'lucide-react'
import { useAuth } from '~/hooks/use-auth'
import { useClub } from '~/hooks/use-club'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { cn } from '~/lib/utils'
import type { DashboardData } from '@regista/shared'

function formatBalance(cents: number): string {
  const value = cents / 100
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`
  return Math.round(value).toLocaleString()
}

interface HeaderPillProps {
  children: React.ReactNode
  className?: string
}

function HeaderPill({ children, className }: HeaderPillProps) {
  return (
    <div className={cn(
      'flex items-center gap-2 rounded-2xl border border-[rgba(113,220,146,0.1)] bg-[rgba(28,46,34,0.5)] px-4 py-2',
      className,
    )}>
      {children}
    </div>
  )
}

interface AppHeaderProps {
  dashboardData?: Pick<DashboardData, 'club' | 'squadStatus' | 'unreadNotifications' | 'divisionName' | 'seasonLabel'>
}

export function AppHeader({ dashboardData }: AppHeaderProps) {
  const { user, logout } = useAuth()
  const { club } = useClub()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate({ to: '/' })
  }

  const data = dashboardData
  const clubName = data?.club?.name ?? club?.name ?? 'My Club'
  const balance = data?.club?.balance ?? club?.balance ?? 0
  const moraleLabel = data?.club?.moraleLabel ?? 'neutral'
  const moraleTrend = data?.club?.moraleTrend ?? 'stable'
  const available = data?.squadStatus?.available ?? 0
  const totalPlayers = data?.squadStatus?.totalPlayers ?? 0
  const unreadCount = data?.unreadNotifications ?? 0
  const divisionName = data?.divisionName ?? ''
  const seasonLabel = data?.seasonLabel ?? ''

  const trendArrow = moraleTrend === 'up' ? '↗' : moraleTrend === 'down' ? '↘' : '→'
  const moraleDisplay = `${moraleLabel.charAt(0).toUpperCase() + moraleLabel.slice(1)} ${trendArrow}`

  const subtitle = [seasonLabel, divisionName].filter(Boolean).join(' · ')

  return (
    <header className="border-b border-[rgba(255,255,255,0.05)] bg-surface-header">
      <div className="flex items-center justify-between px-8 py-4">
        {/* Left: Club info */}
        <div>
          <h2 className="font-display text-[30px] font-bold uppercase leading-tight tracking-tight text-white">
            {clubName}
          </h2>
          {subtitle && (
            <p className="font-body text-xs text-text-secondary">{subtitle}</p>
          )}
        </div>

        {/* Right: Pills + User menu */}
        <div className="flex items-center gap-3">
          {/* Balance pill */}
          <HeaderPill className="hidden md:flex">
            <Wallet className="h-4 w-4 text-pelouse-light" />
            <span className="font-display text-sm font-bold text-white">
              {formatBalance(balance)} G$
            </span>
          </HeaderPill>

          {/* Morale pill */}
          <HeaderPill className="hidden lg:flex">
            <Smile className="h-4 w-4 text-pelouse-light" />
            <span className="font-display text-sm font-bold text-white">
              {moraleDisplay}
            </span>
          </HeaderPill>

          {/* Squad pill */}
          <HeaderPill className="hidden lg:flex">
            <Users className="h-3.5 w-3.5 text-pelouse-light" />
            <span className="font-display text-sm font-bold text-white">
              {available} / {totalPlayers} available
            </span>
          </HeaderPill>

          {/* Alerts pill */}
          <HeaderPill>
            <Bell className="h-4 w-4 text-pelouse-light" />
            <span className="font-display text-sm font-bold text-white">Alerts</span>
            {unreadCount > 0 && (
              <span className="ml-1 rounded-full bg-orange px-1.5 py-0.5 text-[9px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </HeaderPill>

          {/* User dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="ml-2 flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(113,220,146,0.1)] bg-[rgba(28,46,34,0.5)] transition-colors hover:bg-[rgba(28,46,34,0.8)]">
                <User className="h-4 w-4 text-text-secondary" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {user && (
                <div className="px-2 py-1.5 text-sm text-text-secondary">{user.username}</div>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/settings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-orange">
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
