import { apiClient } from '~/lib/api-client'
import type { NotificationPreference } from '@regista/shared'

export async function fetchNotificationPreferences(): Promise<NotificationPreference> {
  return apiClient<NotificationPreference>('/settings/notifications')
}

export async function updateNotificationPreferences(data: Partial<NotificationPreference>): Promise<void> {
  await apiClient('/settings/notifications', {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}
