import { Link } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell } from 'lucide-react'
import { fetchNotifications, markNotificationRead } from '~/lib/notifications'
import { useAuth } from '~/hooks/use-auth'
import { cn } from '~/lib/utils'

interface NotificationPanelProps {
  onClose: () => void
}

export function NotificationPanel({ onClose }: NotificationPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const { isAuthenticated } = useAuth()
  const queryClient = useQueryClient()

  const { data } = useQuery({
    queryKey: ['notifications', 'panel'],
    queryFn: () => fetchNotifications({ limit: 5, isRead: false }),
    enabled: isAuthenticated,
  })

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  const notifications = data?.notifications ?? []

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 w-80 rounded-lg border border-border bg-card shadow-lg"
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold">Notifications</h3>
      </div>

      {notifications.length === 0 ? (
        <div className="p-4">
          <div className="flex flex-col items-center gap-2 py-6 text-center text-sm text-muted-foreground">
            <Bell className="h-8 w-8 opacity-40" />
            <p>No new notifications</p>
          </div>
        </div>
      ) : (
        <div className="max-h-80 overflow-y-auto">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={cn(
                'cursor-pointer border-b border-border px-4 py-3 transition-colors hover:bg-accent/50',
                !n.isRead && 'bg-accent/20',
              )}
              onClick={() => {
                if (!n.isRead) markReadMutation.mutate(n.id)
                if (n.actionUrl) onClose()
              }}
            >
              <p className={cn('text-sm', !n.isRead && 'font-semibold')}>{n.title}</p>
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.message}</p>
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-border px-4 py-2">
        <Link
          to="/notifications"
          onClick={onClose}
          className="block text-center text-xs text-primary hover:underline"
        >
          View all notifications
        </Link>
      </div>
    </div>
  )
}
