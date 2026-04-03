import { apiClient } from '~/lib/api-client'
import type { FinanceSummary, FinanceTransactionListResponse } from '@regista/shared'

export async function fetchFinanceSummary(): Promise<FinanceSummary> {
  return apiClient<FinanceSummary>('/finances')
}

interface FetchTransactionsParams {
  cursor?: string
  limit?: number
  type?: string
}

export async function fetchFinanceTransactions(params: FetchTransactionsParams = {}): Promise<FinanceTransactionListResponse> {
  const searchParams = new URLSearchParams()
  if (params.cursor) searchParams.set('cursor', params.cursor)
  if (params.limit) searchParams.set('limit', String(params.limit))
  if (params.type) searchParams.set('type', params.type)

  const qs = searchParams.toString()
  return apiClient<FinanceTransactionListResponse>(`/finances/transactions${qs ? `?${qs}` : ''}`)
}

export interface SalaryBreakdown {
  players: Array<{
    id: string
    name: string
    position: string
    overall: number
    weeklySalary: number
    contractMatchesRemaining: number
  }>
  totalWeekly: number
  totalMonthly: number
}

export async function fetchSalaryBreakdown(): Promise<SalaryBreakdown> {
  return apiClient<SalaryBreakdown>('/finances/salary-breakdown')
}
