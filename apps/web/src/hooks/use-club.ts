import { useQuery } from '@tanstack/react-query'
import { apiClient } from '~/lib/api-client'
import type { Club, ClubStaff } from '@regista/shared'
import { useAuth } from '~/hooks/use-auth'

interface ClubMineResponse {
  club: Club
  staff?: ClubStaff[]
}

export function useClub() {
  const { isAuthenticated, user } = useAuth()

  const query = useQuery({
    queryKey: ['club', 'mine'],
    queryFn: () => apiClient<ClubMineResponse>('/clubs/mine'),
    enabled: isAuthenticated && !!user?.hasClub,
    staleTime: 5 * 60 * 1000,
  })

  return {
    club: query.data?.club ?? null,
    staff: query.data?.staff ?? null,
    isLoading: query.isPending,
    isError: query.isError,
  }
}
