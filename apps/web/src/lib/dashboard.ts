import { apiClient } from '~/lib/api-client'
import type { DashboardData } from '@regista/shared'

export type { DashboardData } from '@regista/shared'

export async function fetchDashboard() {
    return apiClient<DashboardData>('/dashboard')
}
