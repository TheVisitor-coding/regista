import type { DashboardData } from '~/lib/dashboard'

interface DashboardHeaderProps {
    club: DashboardData['club']
}

const moraleLabelMap = {
    excellent: 'Excellent',
    good: 'Bonne',
    neutral: 'Neutre',
    poor: 'Mauvaise',
    critical: 'Critique',
} as const

export function DashboardHeader({ club }: DashboardHeaderProps) {
    const balanceFormatted = new Intl.NumberFormat('fr-FR').format(club.balance / 100)

    return (
        <section className="rounded-2xl border border-border/80 bg-card/40 p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                    <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Club dashboard</p>
                    <h1 className="text-3xl font-bold tracking-tight">{club.name}</h1>
                    <p className="text-sm text-muted-foreground">Command center for your next decisions.</p>
                </div>
                <div className="grid gap-2 text-right">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Balance</p>
                    <p className="text-2xl font-semibold text-primary">{balanceFormatted} G$</p>
                    <p className="text-sm text-muted-foreground">
                        Morale: {moraleLabelMap[club.moraleLabel]} ({club.morale}/100)
                    </p>
                </div>
            </div>
        </section>
    )
}
