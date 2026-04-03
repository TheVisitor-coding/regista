import { apiClient } from '~/lib/api-client'
import type { MatchListResponse, Match } from '@regista/shared'

interface FetchMatchesParams {
  filter?: 'upcoming' | 'past' | 'all'
  page?: number
  limit?: number
}

export async function fetchMatches(params: FetchMatchesParams = {}): Promise<MatchListResponse> {
  const searchParams = new URLSearchParams()
  if (params.filter) searchParams.set('filter', params.filter)
  if (params.page) searchParams.set('page', String(params.page))
  if (params.limit) searchParams.set('limit', String(params.limit))

  const qs = searchParams.toString()
  return apiClient<MatchListResponse>(`/matches${qs ? `?${qs}` : ''}`)
}

export async function fetchMatch(matchId: string): Promise<{ match: Match }> {
  return apiClient<{ match: Match }>(`/matches/${matchId}`)
}
