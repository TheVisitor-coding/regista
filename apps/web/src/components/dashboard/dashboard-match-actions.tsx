import { ClipboardList } from 'lucide-react'
import type { DashboardData } from '~/lib/dashboard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'

interface DashboardMatchActionsProps {
    data: DashboardData
}

export function DashboardMatchActions({ data }: DashboardMatchActionsProps) {
    return (
        <section className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
            <Card className="border-border/80">
                <CardHeader>
                    <CardTitle>Next match</CardTitle>
                    <CardDescription>Upcoming fixture and tactical readiness.</CardDescription>
                </CardHeader>
                <CardContent>
                    {data.nextMatch ? (
                        <div className="space-y-2">
                            <p className="text-lg font-semibold">vs {data.nextMatch.opponent.name}</p>
                            <p className="text-sm text-muted-foreground">
                                Matchday {data.nextMatch.matchday} - {data.nextMatch.competition}
                            </p>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            No scheduled match yet. Competition data will populate here in Step 3.
                        </p>
                    )}
                </CardContent>
            </Card>

            <Card className="border-border/80">
                <CardHeader>
                    <CardTitle>Quick actions</CardTitle>
                    <CardDescription>Priority actions to keep your club on track.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {data.quickActions.map((action, index) => (
                        <div key={`${action.message}-${index}`} className="flex items-start gap-3 rounded-lg border border-border/60 p-3">
                            <ClipboardList className="mt-0.5 h-4 w-4 text-primary" />
                            <div>
                                <p className="text-sm font-medium">{action.message}</p>
                                {action.actionUrl ? (
                                    <p className="mt-1 text-xs text-muted-foreground">Suggested route: {action.actionUrl}</p>
                                ) : null}
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </section>
    )
}
