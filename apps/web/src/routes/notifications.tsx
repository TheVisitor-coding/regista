import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useAuth } from '~/hooks/use-auth'
import { AppLayout } from '~/components/layout/app-layout'
import { NotificationItem } from '~/components/notifications/notification-item'
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from '~/lib/notifications'
import { Button } from '~/components/ui/button'
import { Bell, CheckCheck } from 'lucide-react'

export const Route = createFileRoute('/notifications')({
  component: NotificationsPage,
})

function NotificationsPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({ to: '/login' })
    }
  }, [isAuthenticated, isLoading, navigate])

  const { data, isPending } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => fetchNotifications({ limit: 50 }),
    enabled: isAuthenticated && !isLoading,
  })

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  if (isLoading || !isAuthenticated) return null

  const notifications = data?.notifications ?? []
  const hasUnread = notifications.some((n) => !n.isRead)

  // Group by day
  const grouped = new Map<string, typeof notifications>()
  for (const n of notifications) {
    const day = new Date(n.createdAt).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    if (!grouped.has(day)) grouped.set(day, [])
    grouped.get(day)!.push(n)
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Notifications</h1>
          {hasUnread && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllMutation.mutate()}
              disabled={markAllMutation.isPending}
            >
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark all read
            </Button>
          )}
        </div>

        {isPending && (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        )}

        {!isPending && notifications.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
            <Bell className="h-12 w-12 opacity-30" />
            <p>No notifications yet</p>
          </div>
        )}

        {!isPending && Array.from(grouped.entries()).map(([day, items]) => (
          <div key={day} className="space-y-3">
            <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {day}
            </h2>
            <div className="space-y-2">
              {items.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onMarkRead={(id) => markReadMutation.mutate(id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  )
}
