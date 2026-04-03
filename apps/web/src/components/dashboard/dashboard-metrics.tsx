import { BellRing, ShieldCheck, Swords, Wallet } from 'lucide-react'
import type { DashboardData } from '~/lib/dashboard'
import { Card, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'

interface DashboardMetricsProps {
    data: DashboardData
}

export function DashboardMetrics({ data }: DashboardMetricsProps) {
    const balanceFormatted = new Intl.NumberFormat('fr-FR').format(data.club.balance / 100)

    return (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard icon={<Wallet className="h-4 w-4" />} label="Club treasury" value={`${balanceFormatted} G$`} />
            <MetricCard icon={<BellRing className="h-4 w-4" />} label="Unread notifications" value={String(data.unreadNotifications)} />
            <MetricCard icon={<ShieldCheck className="h-4 w-4" />} label="Squad available" value={`${data.squadStatus.available}/${data.squadStatus.totalPlayers || 22}`} />
            <MetricCard icon={<Swords className="h-4 w-4" />} label="Recent results" value={data.recentResults.length ? `${data.recentResults.length} matches` : 'No match yet'} />
        </section>
    )
}

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <Card className="border-border/80">
            <CardHeader className="gap-1">
                <CardDescription className="flex items-center gap-2 text-xs uppercase tracking-[0.16em]">
                    {icon}
                    {label}
                </CardDescription>
                <CardTitle className="text-xl">{value}</CardTitle>
            </CardHeader>
        </Card>
    )
}
