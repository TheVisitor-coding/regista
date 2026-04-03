import { apiClient } from '~/lib/api-client'
import type { TacticConfig } from '@regista/shared'

export async function fetchTactics(): Promise<TacticConfig> {
  return apiClient<TacticConfig>('/tactics')
}

export async function updateTactics(data: Partial<TacticConfig>): Promise<void> {
  await apiClient('/tactics', { method: 'PUT', body: JSON.stringify(data) })
}
