import { Link } from '@tanstack/react-router'
import { Swords, AlertCircle, AlertTriangle, Info, CheckCircle, Clock } from 'lucide-react'
import type { DashboardData } from '~/lib/dashboard'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'

interface DashboardMatchActionsProps {
    data: DashboardData
}

const PRIORITY_CONFIG: Record<string, { icon: typeof AlertCircle; color: string; bg: string }> = {
    critical: { icon: AlertCircle, color: 'text-red-500', bg: 'border-l-red-500 bg-red-500/5' },
    important: { icon: AlertTriangle, color: 'text-orange-500', bg: 'border-l-orange-500 bg-orange-500/5' },
    warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'border-l-amber-500 bg-amber-500/5' },
    info: { icon: Info, color: 'text-blue-500', bg: 'border-l-blue-500 bg-blue-500/5' },
    positive: { icon: CheckCircle, color: 'text-emerald-500', bg: 'border-l-emerald-500 bg-emerald-500/5' },
}

function formatCountdown(scheduledAt: string): string {
    const diff = new Date(scheduledAt).getTime() - Date.now()
    if (diff < 0) return 'Now'
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    if (days > 0) return `in ${days}d ${hours}h`
    if (hours > 0) return `in ${hours}h`
    const mins = Math.floor(diff / (1000 * 60))
    return `in ${mins}min`
}

export function DashboardMatchActions({ data }: DashboardMatchActionsProps) {
    return (
        <section className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
            {/* Next match */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm">
                        <Swords className="h-4 w-4" /> Next Match
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {data.nextMatch ? (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-lg font-bold">vs {data.nextMatch.opponent.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        Matchday {data.nextMatch.matchday} · {data.nextMatch.isHome ? 'Home' : 'Away'}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                        <Clock className="h-3 w-3" />
                                        {formatCountdown(data.nextMatch.scheduledAt)}
                                    </div>
                                </div>
                            </div>

                            {/* Opponent form */}
                            {data.nextMatch.opponentForm && data.nextMatch.opponentForm.length > 0 && (
                                <div className="flex items-center gap-1">
                                    <span className="text-[10px] text-muted-foreground mr-1">Opp. form:</span>
                                    {data.nextMatch.opponentForm.map((r, i) => (
                                        <div
                                            key={i}
                                            className={cn(
                                                'h-4 w-4 rounded-full text-center text-[8px] font-bold leading-4 text-white',
                                                r === 'W' ? 'bg-emerald-500' : r === 'D' ? 'bg-zinc-500' : 'bg-red-500',
                                            )}
                                        >
                                            {r}
                                        </div>
                                    ))}
                                </div>
                            )}

                            <Link to="/tactics">
                                <Button size="sm" className="w-full">Prepare tactics</Button>
                            </Link>
                        </div>
                    ) : (
                        <p className="py-4 text-center text-xs text-muted-foreground">No upcoming match</p>
                    )}
                </CardContent>
            </Card>

            {/* Quick actions */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Actions Required</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5">
                    {data.quickActions.map((action, index) => {
                        const config = PRIORITY_CONFIG[action.priority] ?? PRIORITY_CONFIG.info
                        const Icon = config.icon

                        const content = (
                            <div
                                className={cn(
                                    'flex items-start gap-2 rounded-md border-l-2 px-3 py-2 text-xs transition-colors',
                                    config.bg,
                                    action.actionUrl && 'cursor-pointer hover:opacity-80',
                                )}
                            >
                                <Icon className={cn('mt-0.5 h-3 w-3 shrink-0', config.color)} />
                                <span>{action.message}</span>
                            </div>
                        )

                        return action.actionUrl ? (
                            <Link key={index} to={action.actionUrl as any}>
                                {content}
                            </Link>
                        ) : (
                            <div key={index}>{content}</div>
                        )
                    })}
                </CardContent>
            </Card>
        </section>
    )
}
