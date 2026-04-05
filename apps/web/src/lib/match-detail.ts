import { apiClient } from '~/lib/api-client'
import type { MatchEvent, MatchTeamStats, MatchLineupEntry, TacticConfig } from '@regista/shared'

export async function fetchMatchEvents(matchId: string): Promise<{ events: MatchEvent[] }> {
  return apiClient(`/matches/${matchId}/events`)
}

export async function fetchMatchLineups(matchId: string): Promise<{ lineups: Array<MatchLineupEntry & { clubId: string; playerName: string; playerOverall: number }> }> {
  return apiClient(`/matches/${matchId}/lineups`)
}

export async function fetchMatchStats(matchId: string): Promise<{ stats: MatchTeamStats[] }> {
  return apiClient(`/matches/${matchId}/stats`)
}

export async function updateMatchTactics(matchId: string, tactics: Partial<TacticConfig>): Promise<void> {
  await apiClient(`/matches/${matchId}/tactics`, {
    method: 'POST',
    body: JSON.stringify(tactics),
  })
}

export interface MatchSummary {
  result: 'win' | 'draw' | 'loss' | null
  homeScore: number
  awayScore: number
  homeClub: { id: string; name: string; primaryColor: string }
  awayClub: { id: string; name: string; primaryColor: string }
  matchday: number
  motm: { playerId: string; name: string; rating: number; goals: number; assists: number } | null
  highlights: Array<{
    minute: number
    type: string
    clubId: string | null
    playerName: string | null
    secondaryPlayerName: string | null
  }>
  playerRatings: Array<{
    playerId: string
    clubId: string
    name: string
    rating: number
    minutesPlayed: number
    goals: number
    assists: number
  }>
  assistantComment: string
  stats: MatchTeamStats[]
}

export async function fetchMatchSummary(matchId: string): Promise<MatchSummary> {
  return apiClient(`/matches/${matchId}/summary`)
}

export async function fetchPlayerMatchStats(matchId: string): Promise<{ playerStats: any[] }> {
  return apiClient(`/matches/${matchId}/player-stats`)
}
