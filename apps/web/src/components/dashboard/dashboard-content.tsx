import type { DashboardData } from '~/lib/dashboard'
import { DashboardHeader } from '~/components/dashboard/dashboard-header'
import { DashboardMetrics } from '~/components/dashboard/dashboard-metrics'
import { DashboardMatchActions } from '~/components/dashboard/dashboard-match-actions'
import { DashboardResultsStandings } from '~/components/dashboard/dashboard-results-standings'

interface DashboardContentProps {
    data: DashboardData
}

export function DashboardContent({ data }: DashboardContentProps) {
    return (
        <div className="space-y-6">
            <DashboardHeader club={data.club} />
            <DashboardMetrics data={data} />
            <DashboardMatchActions data={data} />
            <DashboardResultsStandings data={data} />
        </div>
    )
}
