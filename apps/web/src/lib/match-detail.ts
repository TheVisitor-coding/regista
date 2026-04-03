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
