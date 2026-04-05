import type { DashboardData } from '~/lib/dashboard'
import { cn } from '~/lib/utils'

interface DashboardHeaderProps {
    club: DashboardData['club']
    seasonProgress: DashboardData['seasonProgress']
}

const moraleLabelMap: Record<string, string> = {
    excellent: 'Excellent',
    good: 'Good',
    neutral: 'Neutral',
    poor: 'Poor',
    critical: 'Critical',
}

const moraleColor: Record<string, string> = {
    excellent: 'text-emerald-400',
    good: 'text-green-400',
    neutral: 'text-zinc-400',
    poor: 'text-orange-400',
    critical: 'text-red-400',
}

const trendIcon: Record<string, string> = {
    up: '↗',
    down: '↘',
    stable: '→',
}

export function DashboardHeader({ club, seasonProgress }: DashboardHeaderProps) {
    const balanceFormatted = new Intl.NumberFormat('en-US').format(club.balance / 100)

    return (
        <section className="rounded-xl border border-border bg-card/40 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight">{club.name}</h1>
                    {seasonProgress && (
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">
                                Season — Matchday {seasonProgress.currentMatchday}/{seasonProgress.totalMatchdays}
                            </p>
                            <div className="h-1.5 w-40 rounded-full bg-muted">
                                <div
                                    className="h-full rounded-full bg-primary transition-all"
                                    style={{ width: `${seasonProgress.percentComplete}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Balance</p>
                        <p className={cn(
                            'text-xl font-bold',
                            club.balance > 0 ? 'text-emerald-500' : 'text-red-500',
                        )}>
                            {balanceFormatted} G$
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Morale</p>
                        <p className={cn('text-xl font-bold', moraleColor[club.moraleLabel] ?? 'text-zinc-400')}>
                            {club.morale}
                            <span className="ml-1 text-sm">{trendIcon[club.moraleTrend]}</span>
                        </p>
                        <p className="text-[10px] text-muted-foreground">{moraleLabelMap[club.moraleLabel]}</p>
                    </div>
                </div>
            </div>
        </section>
    )
}
