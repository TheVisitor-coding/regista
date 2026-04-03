import { apiClient } from '~/lib/api-client'
import type { PlayerListItem, PlayerWithStats } from '@regista/shared'

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

export async function fetchPlayerDetail(playerId: string): Promise<{
  player: PlayerWithStats['stats'] extends null ? never : any
  stats: PlayerWithStats['stats']
  goalkeeperStats: PlayerWithStats['goalkeeperStats']
}> {
  return apiClient(`/squad/${playerId}`)
}
