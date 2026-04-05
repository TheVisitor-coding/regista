import { Button } from '~/components/ui/button'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface DashboardErrorStateProps {
    isNoClub: boolean
}

export function DashboardErrorState({ isNoClub }: DashboardErrorStateProps) {
    return (
        <div className="flex flex-col items-center justify-center gap-4 py-20 fade-in">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <div className="text-center">
                <h2 className="text-lg font-semibold">
                    {isNoClub ? 'No club yet' : 'Something went wrong'}
                </h2>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    {isNoClub
                        ? 'Create your club to start managing your team.'
                        : 'We couldn\'t load your dashboard. Please try again.'}
                </p>
            </div>
            <Button variant="outline" onClick={() => window.location.reload()}>
                <RefreshCw className="mr-2 h-4 w-4" /> Retry
            </Button>
        </div>
    )
}
