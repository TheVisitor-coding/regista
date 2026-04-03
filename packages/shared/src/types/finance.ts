export const FinancialTransactionType = {
  TICKET_REVENUE: 'ticket_revenue',
  TV_RIGHTS: 'tv_rights',
  PLAYER_SALE: 'player_sale',
  SALARY: 'salary',
  PLAYER_PURCHASE: 'player_purchase',
  PRIZE: 'prize',
  OTHER: 'other',
} as const

export type FinancialTransactionType = (typeof FinancialTransactionType)[keyof typeof FinancialTransactionType]

export interface FinancialTransaction {
  id: string
  clubId: string
  type: FinancialTransactionType
  amount: number
  description: string
  referenceId: string | null
  balanceAfter: number
  createdAt: string
}

export interface FinanceSummary {
  balance: number
  revenueLastWeek: number
  expensesLastWeek: number
  weeklyTotalSalary: number
  breakdownByType: Array<{
    type: FinancialTransactionType
    total: number
  }>
}

export interface FinanceTransactionListResponse {
  transactions: FinancialTransaction[]
  nextCursor: string | null
  total: number
}
