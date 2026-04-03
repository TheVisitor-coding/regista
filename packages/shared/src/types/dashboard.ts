import type { MoraleLabel } from './club.js'
import type { NotificationPriority } from './notification.js'

export interface DashboardData {
  club: {
    id: string
    name: string
    logoId: string
    primaryColor: string
    balance: number
    morale: number
    moraleLabel: MoraleLabel
    moraleTrend: 'up' | 'down' | 'stable'
  }
  nextMatch: null | {
    id: string
    opponent: { id: string; name: string; logoId: string }
    scheduledAt: string
    competition: string
    matchday: number
    isHome: boolean
    opponentForm: Array<'W' | 'D' | 'L'>
  }
  recentResults: Array<{
    matchId: string
    opponent: string
    score: string
    result: 'win' | 'draw' | 'loss'
    date: string
  }>
  squadStatus: {
    totalPlayers: number
    available: number
    injured: number
    suspended: number
    averageFatigue: number
    averageFitness: number
  }
  quickActions: Array<{
    priority: NotificationPriority
    message: string
    actionUrl?: string
  }>
  standingExcerpt: Array<{
    position: number
    club: string
    points: number
    goalDiff: number
    isCurrentClub?: boolean
    isNextOpponent?: boolean
  }>
  recentNotifications: Array<{
    id: string
    staffRole: string
    title: string
    message: string
    priority: NotificationPriority
    createdAt: string
  }>
  unreadNotifications: number
}
