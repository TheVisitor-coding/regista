import { Link } from '@tanstack/react-router'
import { UserRound, Stethoscope, Briefcase, FileText } from 'lucide-react'
import { Badge } from '~/components/ui/badge'
import { cn } from '~/lib/utils'
import type { Notification, StaffRole, NotificationPriority } from '@regista/shared'

const STAFF_ICONS: Record<StaffRole, typeof UserRound> = {
  assistant: UserRound,
  doctor: Stethoscope,
  sporting_director: Briefcase,
  secretary: FileText,
}

const STAFF_LABELS: Record<StaffRole, string> = {
  assistant: 'Assistant Coach',
  doctor: 'Doctor',
  sporting_director: 'Sporting Director',
  secretary: 'Secretary',
}

const PRIORITY_VARIANT: Record<NotificationPriority, 'destructive' | 'default' | 'secondary' | 'outline'> = {
  critical: 'destructive',
  important: 'destructive',
  warning: 'default',
  info: 'secondary',
  positive: 'outline',
}

interface NotificationItemProps {
  notification: Notification
  onMarkRead?: (id: string) => void
}

export function NotificationItem({ notification, onMarkRead }: NotificationItemProps) {
  const Icon = STAFF_ICONS[notification.staffRole] ?? FileText
  const staffLabel = STAFF_LABELS[notification.staffRole] ?? notification.staffRole

  const content = (
    <div
      className={cn(
        'flex gap-3 rounded-lg border border-border p-4 transition-colors',
        !notification.isRead && 'bg-accent/30 border-primary/20',
        notification.isRead && 'opacity-70',
      )}
      onClick={() => !notification.isRead && onMarkRead?.(notification.id)}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className={cn('text-sm', !notification.isRead && 'font-semibold')}>
              {notification.title}
            </p>
            <p className="text-xs text-muted-foreground">{staffLabel}</p>
          </div>
          {notification.priority !== 'info' && (
            <Badge variant={PRIORITY_VARIANT[notification.priority]} className="shrink-0 text-[10px]">
              {notification.priority}
            </Badge>
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
        <p className="mt-1 text-[10px] text-muted-foreground/60">
          {new Date(notification.createdAt).toLocaleString()}
        </p>
      </div>
    </div>
  )

  if (notification.actionUrl) {
    return (
      <Link to={notification.actionUrl as any} className="block">
        {content}
      </Link>
    )
  }

  return content
}
