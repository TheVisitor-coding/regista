import { Link, useNavigate } from '@tanstack/react-router'
import { Bell, LogOut, Settings, User } from 'lucide-react'
import { useAuth } from '~/hooks/use-auth'
import { useClub } from '~/hooks/use-club'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { NotificationPanel } from './notification-panel'
import { useState } from 'react'
import { FINANCE_ALERT_THRESHOLD, FINANCE_CRITICAL_THRESHOLD } from '@regista/shared'

function formatBalance(cents: number): string {
  const value = cents / 100
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`
  return value.toFixed(0)
}

function balanceColor(cents: number): string {
  if (cents <= FINANCE_CRITICAL_THRESHOLD) return 'text-red-500'
  if (cents <= FINANCE_ALERT_THRESHOLD) return 'text-orange-500'
  return 'text-emerald-500'
}

interface AppHeaderProps {
  unreadCount?: number
}

export function AppHeader({ unreadCount = 0 }: AppHeaderProps) {
  const { user, logout } = useAuth()
  const { club } = useClub()
  const navigate = useNavigate()
  const [notifOpen, setNotifOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate({ to: '/' })
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="text-xl font-bold text-primary">
            Regista
          </Link>
          {club && (
            <div className="hidden items-center gap-2 sm:flex">
              <span className="text-sm text-muted-foreground">{club.name}</span>
              <span className={`text-sm font-medium ${balanceColor(club.balance)}`}>
                {formatBalance(club.balance)} G$
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Notification bell */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => setNotifOpen(!notifOpen)}
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -right-1 -top-1 h-5 min-w-5 px-1 text-[10px]"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </Button>
            {notifOpen && (
              <NotificationPanel onClose={() => setNotifOpen(false)} />
            )}
          </div>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">{user?.username}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link to="/settings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive-foreground"
              >
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
