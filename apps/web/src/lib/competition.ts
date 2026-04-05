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

export interface Scorer {
  playerId: string
  playerName: string
  position: string
  clubName: string
  clubId: string
  goals: number
  assists: number
  matches: number
  avgRating: number
  isCurrentClub: boolean
}

export async function fetchScorers(limit = 20): Promise<{ scorers: Scorer[] }> {
  return apiClient(`/competition/scorers?limit=${limit}`)
}

export async function fetchSeasonHistory(): Promise<{
  seasons: Array<{
    seasonId: string
    number: number
    divisionName: string
    finalPosition: number
    points: number
    promoted: boolean
    relegated: boolean
    champion: boolean
    prizeMoney: number
  }>
}> {
  return apiClient('/competition/seasons')
}

export interface ClubStats {
  season: {
    played: number
    won: number
    drawn: number
    lost: number
    goalsFor: number
    goalsAgainst: number
    goalDifference: number
    cleanSheets: number
    biggestWin: { opponent: string; score: string } | null
    biggestLoss: { opponent: string; score: string } | null
  }
  topPlayers: {
    topScorer: { name: string; goals: number } | null
    topAssists: { name: string; assists: number } | null
    topRating: { name: string; avgRating: number } | null
  }
}

export async function fetchClubStats(): Promise<ClubStats> {
  return apiClient('/stats/club')
}
