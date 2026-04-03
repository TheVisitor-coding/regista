import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'

export function DashboardLoading() {
    return (
        <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-border/80">
                <CardHeader>
                    <CardTitle>Loading dashboard</CardTitle>
                    <CardDescription>Collecting your latest club data.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-2 w-full animate-pulse rounded bg-muted" />
                </CardContent>
            </Card>
            <Card className="border-border/80">
                <CardHeader>
                    <CardTitle>Preparing widgets</CardTitle>
                    <CardDescription>Match, squad and actions will appear here.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-2 w-2/3 animate-pulse rounded bg-muted" />
                </CardContent>
            </Card>
        </div>
    )
}
