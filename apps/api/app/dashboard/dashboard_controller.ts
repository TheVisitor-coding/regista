import type { HttpContext } from '@adonisjs/core/http'
import { db } from '@regista/db'
import { clubs, notifications, players, matches, seasons, standings } from '@regista/db'
import { and, asc, avg, count, desc, eq, gte, or, sql } from 'drizzle-orm'
import { FINANCE_ALERT_THRESHOLD, FINANCE_CRITICAL_THRESHOLD } from '@regista/shared'

function moraleLabel(morale: number): 'excellent' | 'good' | 'neutral' | 'poor' | 'critical' {
    if (morale >= 80) return 'excellent'
    if (morale >= 60) return 'good'
    if (morale >= 40) return 'neutral'
    if (morale >= 20) return 'poor'
    return 'critical'
}

export default class DashboardController {
    async show({ auth, response }: HttpContext) {
        const [club] = await db
            .select()
            .from(clubs)
            .where(eq(clubs.userId, auth.userId))
            .limit(1)

        if (!club) {
            return response.notFound({
                error: 'CLUB_NOT_FOUND',
                message: 'You do not have a club yet',
            })
        }

        // Squad status
        const squadPlayers = await db
            .select({
                totalPlayers: count(players.id),
                injured: count(sql`CASE WHEN ${players.isInjured} = true THEN 1 END`),
                suspended: count(sql`CASE WHEN ${players.isSuspended} = true THEN 1 END`),
                avgFatigue: avg(players.fatigue),
            })
            .from(players)
            .where(eq(players.clubId, club.id))

        const stats = squadPlayers[0]
        const totalPlayers = Number(stats?.totalPlayers ?? 0)
        const injured = Number(stats?.injured ?? 0)
        const suspended = Number(stats?.suspended ?? 0)
        const avgFatigue = Math.round(Number(stats?.avgFatigue ?? 0))

        // Unread notifications
        const [unreadResult] = await db
            .select({ value: count(notifications.id) })
            .from(notifications)
            .where(and(eq(notifications.clubId, club.id), eq(notifications.isRead, false)))

        // Recent notifications (5 latest unread)
        const recentNotifs = await db
            .select()
            .from(notifications)
            .where(and(eq(notifications.clubId, club.id), eq(notifications.isRead, false)))
            .orderBy(desc(notifications.createdAt))
            .limit(5)

        // Next match
        let nextMatch = null
        const now = new Date()
        const [nextMatchRow] = await db
            .select()
            .from(matches)
            .where(
                and(
                    or(eq(matches.homeClubId, club.id), eq(matches.awayClubId, club.id)),
                    gte(matches.scheduledAt, now),
                    eq(matches.status, 'scheduled'),
                ),
            )
            .orderBy(asc(matches.scheduledAt))
            .limit(1)

        if (nextMatchRow) {
            const opponentId = nextMatchRow.homeClubId === club.id
                ? nextMatchRow.awayClubId
                : nextMatchRow.homeClubId

            const [opponent] = await db
                .select({ id: clubs.id, name: clubs.name, logoId: clubs.logoId })
                .from(clubs)
                .where(eq(clubs.id, opponentId))
                .limit(1)

            if (opponent) {
                nextMatch = {
                    id: nextMatchRow.id,
                    opponent: { id: opponent.id, name: opponent.name, logoId: opponent.logoId },
                    scheduledAt: nextMatchRow.scheduledAt.toISOString(),
                    competition: 'League',
                    matchday: nextMatchRow.matchday,
                    isHome: nextMatchRow.homeClubId === club.id,
                    opponentForm: [] as string[],
                }
            }
        }

        // Standings excerpt
        let standingExcerpt: Array<{
            position: number
            club: string
            points: number
            goalDiff: number
            isCurrentClub?: boolean
            isNextOpponent?: boolean
        }> = []

        if (club.divisionId) {
            const [season] = await db
                .select()
                .from(seasons)
                .where(and(eq(seasons.divisionId, club.divisionId), eq(seasons.status, 'in_progress')))
                .limit(1)

            if (season) {
                // Get club's position
                const [myStanding] = await db
                    .select()
                    .from(standings)
                    .where(and(eq(standings.seasonId, season.id), eq(standings.clubId, club.id)))
                    .limit(1)

                const myPos = myStanding?.position ?? 10
                const minPos = Math.max(1, myPos - 2)
                const maxPos = myPos + 2

                const excerptRows = await db
                    .select({
                        position: standings.position,
                        points: standings.points,
                        goalDifference: standings.goalDifference,
                        clubId: standings.clubId,
                        clubName: clubs.name,
                    })
                    .from(standings)
                    .innerJoin(clubs, eq(standings.clubId, clubs.id))
                    .where(
                        and(
                            eq(standings.seasonId, season.id),
                            gte(standings.position, minPos),
                            sql`${standings.position} <= ${maxPos}`,
                        ),
                    )
                    .orderBy(asc(standings.position))

                standingExcerpt = excerptRows.map((r) => ({
                    position: r.position,
                    club: r.clubName,
                    points: r.points,
                    goalDiff: r.goalDifference,
                    isCurrentClub: r.clubId === club.id,
                    isNextOpponent: nextMatch ? r.clubId === nextMatch.opponent.id : false,
                }))
            }
        }

        // Quick actions
        const quickActions: Array<{ priority: string; message: string; actionUrl?: string }> = []

        if (club.balance <= FINANCE_CRITICAL_THRESHOLD) {
            quickActions.push({
                priority: 'critical',
                message: 'Your balance is negative! Review your finances immediately.',
                actionUrl: '/finances',
            })
        } else if (club.balance <= FINANCE_ALERT_THRESHOLD) {
            quickActions.push({
                priority: 'warning',
                message: 'Your balance is running low. Consider your spending.',
                actionUrl: '/finances',
            })
        }

        if (avgFatigue > 70) {
            quickActions.push({
                priority: 'important',
                message: `Average team fatigue is high (${avgFatigue}%). Consider resting key players.`,
                actionUrl: '/squad',
            })
        }

        if (quickActions.length === 0) {
            quickActions.push({
                priority: 'info',
                message: 'Review your squad and prepare for the next match.',
                actionUrl: '/squad',
            })
        }

        return response.ok({
            club: {
                id: club.id,
                name: club.name,
                logoId: club.logoId,
                primaryColor: club.primaryColor,
                balance: club.balance,
                morale: club.morale,
                moraleLabel: moraleLabel(club.morale),
                moraleTrend: 'stable' as const,
            },
            nextMatch,
            recentResults: [],
            squadStatus: {
                totalPlayers,
                available: totalPlayers - injured - suspended,
                injured,
                suspended,
                averageFatigue: avgFatigue,
                averageFitness: 100 - avgFatigue,
            },
            quickActions,
            standingExcerpt,
            recentNotifications: recentNotifs.map((n) => ({
                id: n.id,
                staffRole: n.staffRole,
                title: n.title,
                message: n.message,
                priority: n.priority,
                createdAt: n.createdAt.toISOString(),
            })),
            unreadNotifications: unreadResult?.value ?? 0,
        })
    }
}
