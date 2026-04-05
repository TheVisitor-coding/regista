import { apiClient } from '~/lib/api-client'
import type { PlayerListItem } from '@regista/shared'

interface FetchSquadParams {
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  line?: string
}

export async function fetchSquad(params: FetchSquadParams = {}): Promise<{ players: PlayerListItem[] }> {
  const searchParams = new URLSearchParams()
  if (params.sortBy) searchParams.set('sortBy', params.sortBy)
  if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder)
  if (params.line) searchParams.set('line', params.line)
  const qs = searchParams.toString()
  return apiClient<{ players: PlayerListItem[] }>(`/squad${qs ? `?${qs}` : ''}`)
}

export async function fetchPlayerDetail(playerId: string): Promise<any> {
  return apiClient(`/squad/${playerId}`)
}

export async function fetchPlayerHistory(playerId: string, limit = 20): Promise<{
  performances: Array<{
    matchId: string
    matchday: number
    opponent: { name: string }
    minutesPlayed: number
    goals: number
    assists: number
    rating: number
    date: string
  }>
  overallHistory: Array<{ matchday: number; overall: number }>
}> {
  return apiClient(`/squad/${playerId}/history?limit=${limit}`)
}

export async function comparePlayers(id1: string, id2: string): Promise<{ players: any[] }> {
  return apiClient(`/squad/compare?players=${id1},${id2}`)
}

export async function extendContract(playerId: string): Promise<{
  player: { contractMatchesRemaining: number; weeklySalary: number; releaseClause: number }
  signingBonus: number
  club: { balanceAfter: number }
}> {
  return apiClient(`/squad/${playerId}/extend-contract`, { method: 'POST' })
}

export async function fetchPlayerValuation(playerId: string): Promise<{ marketValue: number }> {
  return apiClient(`/squad/${playerId}/valuation`)
}
