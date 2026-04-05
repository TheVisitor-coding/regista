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
    opponent: { id: string; name: string; logoId: string; primaryColor?: string }
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
    isHome: boolean
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
    played: number
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
  seasonProgress: {
    currentMatchday: number
    totalMatchdays: number
    percentComplete: number
  } | null
  unreadNotifications: number
  divisionName: string | null
  seasonLabel: string | null
  topScorer: { name: string; goals: number } | null
  bestFormPlayer: { name: string; form: string } | null
  nextContractExpiry: { name: string; matchesLeft: number } | null
  trainingIntensity: { level: string; percent: number } | null
}
