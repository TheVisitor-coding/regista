import type { StaffRole } from './club.js'

export const NotificationCategory = {
  MATCH: 'match',
  INJURY: 'injury',
  FINANCE: 'finance',
  TRANSFER: 'transfer',
  TACTIC: 'tactic',
  SYSTEM: 'system',
} as const

export type NotificationCategory = (typeof NotificationCategory)[keyof typeof NotificationCategory]

export const NotificationPriority = {
  CRITICAL: 'critical',
  IMPORTANT: 'important',
  WARNING: 'warning',
  INFO: 'info',
  POSITIVE: 'positive',
} as const

export type NotificationPriority = (typeof NotificationPriority)[keyof typeof NotificationPriority]

export interface Notification {
  id: string
  clubId: string
  staffRole: StaffRole
  category: NotificationCategory
  priority: NotificationPriority
  title: string
  message: string
  actionUrl: string | null
  isRead: boolean
  isPinned: boolean
  metadata: Record<string, unknown> | null
  createdAt: string
}

export interface NotificationListResponse {
  notifications: Notification[]
  nextCursor: string | null
  total: number
}
