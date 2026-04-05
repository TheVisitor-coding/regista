import { Link } from '@tanstack/react-router'
import type { DashboardData } from '~/lib/dashboard'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { cn } from '~/lib/utils'

interface DashboardResultsStandingsProps {
    data: DashboardData
}

const RESULT_ICONS: Record<string, { icon: string; color: string }> = {
    win: { icon: '🟢', color: 'text-emerald-500' },
    draw: { icon: '⚪', color: 'text-zinc-400' },
    loss: { icon: '🔴', color: 'text-red-500' },
}

export function DashboardResultsStandings({ data }: DashboardResultsStandingsProps) {
    return (
        <section className="grid gap-4 lg:grid-cols-2">
            {/* Recent results */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Recent Results</CardTitle>
                </CardHeader>
                <CardContent>
                    {data.recentResults.length > 0 ? (
                        <div className="space-y-1.5">
                            {data.recentResults.map((result) => {
                                const r = RESULT_ICONS[result.result] ?? RESULT_ICONS.draw
                                return (
                                    <div key={result.matchId} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent/30">
                                        <span>{r.icon}</span>
                                        <span className="flex-1 truncate">{result.opponent}</span>
                                        <span className={cn('font-bold', r.color)}>{result.score}</span>
                                    </div>
                                )
                            })}
                            {/* Form indicator */}
                            <div className="mt-2 flex items-center gap-1 pt-1">
                                <span className="text-[10px] text-muted-foreground mr-1">Form:</span>
                                {data.recentResults.map((r, i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            'h-4 w-4 rounded-full text-center text-[8px] font-bold leading-4 text-white',
                                            r.result === 'win' ? 'bg-emerald-500' : r.result === 'draw' ? 'bg-zinc-500' : 'bg-red-500',
                                        )}
                                    >
                                        {r.result === 'win' ? 'W' : r.result === 'draw' ? 'D' : 'L'}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p className="py-4 text-center text-xs text-muted-foreground">No results yet</p>
                    )}
                </CardContent>
            </Card>

            {/* League excerpt */}
            <Card>
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">League Standings</CardTitle>
                        <Link to="/competition" className="text-[10px] text-primary hover:underline">View all</Link>
                    </div>
                </CardHeader>
                <CardContent>
                    {data.standingExcerpt.length > 0 ? (
                        <div className="space-y-1">
                            {data.standingExcerpt.map((row) => (
                                <div
                                    key={`${row.position}-${row.club}`}
                                    className={cn(
                                        'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm',
                                        row.isCurrentClub && 'bg-primary/10 font-semibold',
                                        row.isNextOpponent && 'border-l-2 border-l-amber-500',
                                    )}
                                >
                                    <span className="w-5 text-xs text-muted-foreground">#{row.position}</span>
                                    <span className={cn('flex-1 truncate', row.isCurrentClub && 'text-primary')}>
                                        {row.club}
                                    </span>
                                    <span className="text-xs font-medium">{row.points} pts</span>
                                    <span className="w-10 text-right text-[10px] text-muted-foreground">
                                        {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="py-4 text-center text-xs text-muted-foreground">No standings data yet</p>
                    )}
                </CardContent>
            </Card>
        </section>
    )
}
