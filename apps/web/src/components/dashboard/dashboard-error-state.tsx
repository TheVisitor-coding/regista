import { useNavigate } from '@tanstack/react-router'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'

interface DashboardErrorStateProps {
    isNoClub: boolean
}

export function DashboardErrorState({ isNoClub }: DashboardErrorStateProps) {
    const navigate = useNavigate()

    return (
        <Card className="border-border/80">
            <CardHeader>
                <CardTitle>{isNoClub ? 'Club not created yet' : 'Dashboard unavailable'}</CardTitle>
                <CardDescription>
                    {isNoClub
                        ? 'Create your club to unlock the full manager dashboard.'
                        : 'An unexpected error occurred while loading your dashboard data.'}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-3">
                <Button onClick={() => navigate({ to: '/settings' })}>Open settings</Button>
                <Button variant="ghost" onClick={() => window.location.reload()}>
                    Retry
                </Button>
            </CardContent>
        </Card>
    )
}
