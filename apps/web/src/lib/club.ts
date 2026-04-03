import { apiClient } from '~/lib/api-client'
import type { Club, CreateClubRequest, AvailabilityCheck } from '@regista/shared'

export async function checkClubName(name: string): Promise<AvailabilityCheck> {
  return apiClient<AvailabilityCheck>(`/clubs/check-name?name=${encodeURIComponent(name)}`)
}

export async function createClub(data: CreateClubRequest): Promise<{ club: Club; squadSize?: number }> {
  return apiClient<{ club: Club; squadSize?: number }>('/clubs', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function fetchMyClub(): Promise<{ club: Club }> {
  return apiClient<{ club: Club }>('/clubs/mine')
}
