import { AlertTriangle } from 'lucide-react'
import type { DashboardData } from '~/lib/dashboard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'

interface DashboardResultsStandingsProps {
    data: DashboardData
}

export function DashboardResultsStandings({ data }: DashboardResultsStandingsProps) {
    return (
        <section className="grid gap-4 lg:grid-cols-2">
            <Card className="border-border/80">
                <CardHeader>
                    <CardTitle>Recent results</CardTitle>
                    <CardDescription>Last completed fixtures for your club.</CardDescription>
                </CardHeader>
                <CardContent>
                    {data.recentResults.length ? (
                        <ul className="space-y-2">
                            {data.recentResults.map((result) => (
                                <li key={result.matchId} className="flex items-center justify-between rounded-lg border border-border/60 p-3 text-sm">
                                    <span>{result.opponent}</span>
                                    <span className="font-semibold">{result.score}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            No results yet. Match simulation integration is coming in the next steps.
                        </p>
                    )}
                </CardContent>
            </Card>

            <Card className="border-border/80">
                <CardHeader>
                    <CardTitle>League excerpt</CardTitle>
                    <CardDescription>Your nearby ranking context.</CardDescription>
                </CardHeader>
                <CardContent>
                    {data.standingExcerpt.length ? (
                        <ul className="space-y-2">
                            {data.standingExcerpt.map((row) => (
                                <li key={`${row.position}-${row.club}`} className="flex items-center justify-between rounded-lg border border-border/60 p-3 text-sm">
                                    <span>#{row.position} {row.club}</span>
                                    <span>{row.points} pts</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="flex items-start gap-2 text-sm text-muted-foreground">
                            <AlertTriangle className="mt-0.5 h-4 w-4" />
                            <p>Competition standings are not generated yet for this phase.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </section>
    )
}
