import { apiClient } from '~/lib/api-client'

export interface DashboardData {
    club: {
        id: string
        name: string
        logoId: string
        primaryColor: string
        balance: number
        morale: number
        moraleLabel: 'excellent' | 'good' | 'neutral' | 'poor' | 'critical'
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
        priority: 'critical' | 'important' | 'warning' | 'info' | 'positive'
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
    unreadNotifications: number
}

export async function fetchDashboard() {
    return apiClient<DashboardData>('/dashboard')
}
