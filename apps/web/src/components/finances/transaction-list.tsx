import type { FinancialTransaction } from '@regista/shared'
import { cn } from '~/lib/utils'
import {
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react'

interface TransactionListProps {
  transactions: FinancialTransaction[]
}

const TYPE_LABELS: Record<string, string> = {
  ticket_revenue: 'Ticket Revenue',
  tv_rights: 'TV Rights',
  player_sale: 'Player Sale',
  salary: 'Salary',
  player_purchase: 'Player Purchase',
  prize: 'Prize',
  other: 'Other',
}

function formatAmount(cents: number): string {
  const value = Math.abs(cents) / 100
  const prefix = cents >= 0 ? '+' : '-'
  return `${prefix}${new Intl.NumberFormat('en-US').format(value)} G$`
}

export function TransactionList({ transactions }: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No transactions yet
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {transactions.map((t) => (
        <div
          key={t.id}
          className="flex items-center gap-3 rounded-lg border border-border p-3"
        >
          <div className={cn(
            'flex h-8 w-8 items-center justify-center rounded-full',
            t.amount >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10',
          )}>
            {t.amount >= 0 ? (
              <ArrowDownLeft className="h-4 w-4 text-emerald-500" />
            ) : (
              <ArrowUpRight className="h-4 w-4 text-red-500" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm">{t.description}</p>
            <p className="text-xs text-muted-foreground">
              {TYPE_LABELS[t.type] ?? t.type}
            </p>
          </div>
          <div className="text-right">
            <p className={cn(
              'text-sm font-medium',
              t.amount >= 0 ? 'text-emerald-500' : 'text-red-500',
            )}>
              {formatAmount(t.amount)}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {new Date(t.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
