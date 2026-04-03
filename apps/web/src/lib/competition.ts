import { apiClient } from '~/lib/api-client'
import type { CompetitionInfoResponse, StandingsResponse, MatchdayResponse } from '@regista/shared'

export async function fetchCompetitionInfo(): Promise<CompetitionInfoResponse> {
  return apiClient<CompetitionInfoResponse>('/competition')
}

export async function fetchStandings(): Promise<StandingsResponse> {
  return apiClient<StandingsResponse>('/competition/standings')
}

export async function fetchMatchday(number: number): Promise<MatchdayResponse> {
  return apiClient<MatchdayResponse>(`/competition/matchday/${number}`)
}
