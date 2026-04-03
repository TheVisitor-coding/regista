import { Wallet } from 'lucide-react'
import { Card, CardContent } from '~/components/ui/card'
import { FINANCE_ALERT_THRESHOLD, FINANCE_CRITICAL_THRESHOLD } from '@regista/shared'
import { cn } from '~/lib/utils'

interface BalanceCardProps {
  balance: number
}

function formatBalance(cents: number): string {
  const value = cents / 100
  return new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function balanceColor(cents: number): string {
  if (cents <= FINANCE_CRITICAL_THRESHOLD) return 'text-red-500'
  if (cents <= FINANCE_ALERT_THRESHOLD) return 'text-orange-500'
  return 'text-emerald-500'
}

export function BalanceCard({ balance }: BalanceCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Wallet className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Current Balance</p>
          <p className={cn('text-3xl font-bold', balanceColor(balance))}>
            {formatBalance(balance)} G$
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
