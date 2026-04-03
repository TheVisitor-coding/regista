import { apiClient } from '~/lib/api-client'
import type { NotificationListResponse, Notification } from '@regista/shared'

interface FetchNotificationsParams {
  cursor?: string
  limit?: number
  category?: string
  staffRole?: string
  isRead?: boolean
}

export async function fetchNotifications(params: FetchNotificationsParams = {}): Promise<NotificationListResponse> {
  const searchParams = new URLSearchParams()
  if (params.cursor) searchParams.set('cursor', params.cursor)
  if (params.limit) searchParams.set('limit', String(params.limit))
  if (params.category) searchParams.set('category', params.category)
  if (params.staffRole) searchParams.set('staffRole', params.staffRole)
  if (params.isRead !== undefined) searchParams.set('isRead', String(params.isRead))

  const qs = searchParams.toString()
  return apiClient<NotificationListResponse>(`/notifications${qs ? `?${qs}` : ''}`)
}

export async function markNotificationRead(id: string): Promise<{ notification: Notification }> {
  return apiClient<{ notification: Notification }>(`/notifications/${id}/read`, { method: 'PATCH' })
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiClient('/notifications/read-all', { method: 'PATCH' })
}

export async function fetchUnreadCount(): Promise<{ count: number }> {
  return apiClient<{ count: number }>('/notifications/unread-count')
}
