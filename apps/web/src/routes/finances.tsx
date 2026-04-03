import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useAuth } from '~/hooks/use-auth'
import { AppLayout } from '~/components/layout/app-layout'
import { BalanceCard } from '~/components/finances/balance-card'
import { TransactionList } from '~/components/finances/transaction-list'
import { fetchFinanceSummary, fetchFinanceTransactions, fetchSalaryBreakdown } from '~/lib/finances'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { TrendingUp, TrendingDown, Users } from 'lucide-react'

export const Route = createFileRoute('/finances')({
  component: FinancesPage,
})

function formatAmount(cents: number): string {
  const value = cents / 100
  return new Intl.NumberFormat('en-US').format(value)
}

function FinancesPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({ to: '/login' })
    }
  }, [isAuthenticated, isLoading, navigate])

  const { data: summary, isPending: summaryPending } = useQuery({
    queryKey: ['finances', 'summary'],
    queryFn: fetchFinanceSummary,
    enabled: isAuthenticated && !isLoading,
  })

  const { data: txData, isPending: txPending } = useQuery({
    queryKey: ['finances', 'transactions'],
    queryFn: () => fetchFinanceTransactions({ limit: 20 }),
    enabled: isAuthenticated && !isLoading,
  })

  if (isLoading || !isAuthenticated) return null

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Finances</h1>

        {summaryPending ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : summary ? (
          <>
            <BalanceCard balance={summary.balance} />

            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                    Revenue (7 days)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xl font-bold text-emerald-500">
                    +{formatAmount(summary.revenueLastWeek)} G$
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <TrendingDown className="h-4 w-4 text-red-500" />
                    Expenses (7 days)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xl font-bold text-red-500">
                    -{formatAmount(summary.expensesLastWeek)} G$
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Users className="h-4 w-4" />
                    Weekly Salaries
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xl font-bold">
                    {formatAmount(summary.weeklyTotalSalary)} G$
                  </p>
                </CardContent>
              </Card>
            </div>
          </>
        ) : null}

        {/* Salary Breakdown */}
        <SalaryBreakdownSection />

        <div>
          <h2 className="mb-4 text-lg font-semibold">Transaction History</h2>
          {txPending ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            <TransactionList transactions={txData?.transactions ?? []} />
          )}
        </div>
      </div>
    </AppLayout>
  )
}

function SalaryBreakdownSection() {
  const { isAuthenticated } = useAuth()

  const { data, isPending } = useQuery({
    queryKey: ['finances', 'salary-breakdown'],
    queryFn: fetchSalaryBreakdown,
    enabled: isAuthenticated,
  })

  if (isPending) return null

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">Salary Breakdown</h2>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-3 py-2 text-left">Player</th>
              <th className="px-3 py-2 text-center">Pos</th>
              <th className="px-3 py-2 text-center">OVR</th>
              <th className="px-3 py-2 text-right">Salary/week</th>
              <th className="hidden px-3 py-2 text-right sm:table-cell">Contract</th>
            </tr>
          </thead>
          <tbody>
            {(data?.players ?? []).map((p) => (
              <tr key={p.id} className="border-b border-border">
                <td className="px-3 py-2">{p.name}</td>
                <td className="px-3 py-2 text-center text-muted-foreground">{p.position}</td>
                <td className="px-3 py-2 text-center">{p.overall}</td>
                <td className="px-3 py-2 text-right">{formatAmount(p.weeklySalary)} G$</td>
                <td className="hidden px-3 py-2 text-right text-muted-foreground sm:table-cell">{p.contractMatchesRemaining} matches</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-border font-semibold">
              <td colSpan={3} className="px-3 py-2">Total Weekly</td>
              <td className="px-3 py-2 text-right">{formatAmount(data?.totalWeekly ?? 0)} G$</td>
              <td className="hidden sm:table-cell" />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
