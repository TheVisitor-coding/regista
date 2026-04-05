import type { HttpContext } from '@adonisjs/core/http'
import { db } from '@regista/db'
import { clubs, players, playerStats, goalkeeperStats, matchPlayerStats, matches, playerOverallHistory } from '@regista/db'
import { and, asc, desc, eq, inArray } from 'drizzle-orm'
import { listSquadValidator } from './squad_validator.js'
import { ValuationService } from '../transfers/valuation_service.js'
import { FinanceService } from '../finances/finance_service.js'
import { SALARY_BASE_PER_OVERALL, SALARY_RANDOM_BONUS_MAX } from '@regista/shared'

const POSITION_LINE_MAP: Record<string, string[]> = {
    GK: ['GK'],
    DEF: ['CB', 'LB', 'RB'],
    MID: ['CDM', 'CM', 'CAM'],
    ATT: ['LW', 'RW', 'ST', 'CF'],
}

async function getClubId(userId: string): Promise<string | null> {
    const [club] = await db
        .select({ id: clubs.id })
        .from(clubs)
        .where(eq(clubs.userId, userId))
        .limit(1)
    return club?.id ?? null
}

export default class SquadController {
    async index({ auth, request, response }: HttpContext) {
        const clubId = await getClubId(auth.userId)
        if (!clubId) {
            return response.notFound({ error: 'CLUB_NOT_FOUND' })
        }

        const params = await listSquadValidator.validate(request.qs())

        const conditions = [eq(players.clubId, clubId)]

        if (params.line) {
            const positions = POSITION_LINE_MAP[params.line]
            if (positions) {
                conditions.push(inArray(players.position, positions as any))
            }
        }

        // Determine sort
        let orderBy
        const direction = params.sortOrder === 'asc' ? asc : desc
        switch (params.sortBy) {
            case 'overall':
                orderBy = direction(players.overall)
                break
            case 'fatigue':
                orderBy = direction(players.fatigue)
                break
            case 'age':
                orderBy = direction(players.age)
                break
            case 'salary':
                orderBy = direction(players.weeklySalary)
                break
            case 'name':
                orderBy = direction(players.lastName)
                break
            default:
                orderBy = asc(players.position)
        }

        const result = await db
            .select()
            .from(players)
            .where(eq(players.clubId, clubId))
            .orderBy(orderBy)

        return response.ok({
            players: result.map((p) => ({
                id: p.id,
                firstName: p.firstName,
                lastName: p.lastName,
                nationality: p.nationality,
                age: p.age,
                position: p.position,
                secondaryPositions: p.secondaryPositions,
                overall: p.overall,
                potential: p.potential,
                fatigue: p.fatigue,
                isInjured: p.isInjured,
                injuryMatchesRemaining: p.injuryMatchesRemaining,
                injuryType: p.injuryType,
                isSuspended: p.isSuspended,
                suspensionMatchesRemaining: p.suspensionMatchesRemaining,
                yellowCardsSeason: p.yellowCardsSeason,
                contractMatchesRemaining: p.contractMatchesRemaining,
                weeklySalary: p.weeklySalary,
                releaseClause: p.releaseClause,
            })),
        })
    }

    async show({ auth, params, response }: HttpContext) {
        const clubId = await getClubId(auth.userId)
        if (!clubId) {
            return response.notFound({ error: 'CLUB_NOT_FOUND' })
        }

        const [player] = await db
            .select()
            .from(players)
            .where(eq(players.id, params.playerId))
            .limit(1)

        if (!player || player.clubId !== clubId) {
            return response.notFound({ error: 'PLAYER_NOT_FOUND' })
        }

        const [stats] = await db
            .select()
            .from(playerStats)
            .where(eq(playerStats.playerId, player.id))
            .limit(1)

        const [gkStats] = await db
            .select()
            .from(goalkeeperStats)
            .where(eq(goalkeeperStats.playerId, player.id))
            .limit(1)

        return response.ok({
            player: {
                id: player.id,
                clubId: player.clubId,
                firstName: player.firstName,
                lastName: player.lastName,
                nationality: player.nationality,
                age: player.age,
                position: player.position,
                secondaryPositions: player.secondaryPositions,
                overall: player.overall,
                potential: player.potential,
                fatigue: player.fatigue,
                isInjured: player.isInjured,
                injuryMatchesRemaining: player.injuryMatchesRemaining,
                injuryType: player.injuryType,
                isSuspended: player.isSuspended,
                suspensionMatchesRemaining: player.suspensionMatchesRemaining,
                yellowCardsSeason: player.yellowCardsSeason,
                contractMatchesRemaining: player.contractMatchesRemaining,
                weeklySalary: player.weeklySalary,
                releaseClause: player.releaseClause,
                createdAt: player.createdAt.toISOString(),
                updatedAt: player.updatedAt.toISOString(),
            },
            stats: stats ? {
                pace: stats.pace,
                stamina: stats.stamina,
                strength: stats.strength,
                agility: stats.agility,
                passing: stats.passing,
                shooting: stats.shooting,
                dribbling: stats.dribbling,
                crossing: stats.crossing,
                heading: stats.heading,
                vision: stats.vision,
                composure: stats.composure,
                workRate: stats.workRate,
                positioning: stats.positioning,
                tackling: stats.tackling,
                marking: stats.marking,
                penalties: stats.penalties,
                freeKick: stats.freeKick,
            } : null,
            goalkeeperStats: gkStats ? {
                reflexes: gkStats.reflexes,
                diving: gkStats.diving,
                handling: gkStats.handling,
                positioning: gkStats.positioning,
                kicking: gkStats.kicking,
                communication: gkStats.communication,
                penalties: gkStats.penalties,
                freeKick: gkStats.freeKick,
            } : null,
            marketValue: ValuationService.calculateMarketValue(
                player.overall, player.age, player.potential,
                player.position as any, player.contractMatchesRemaining,
            ),
        })
    }

    async history({ auth, params, request, response }: HttpContext) {
        const clubId = await getClubId(auth.userId)
        if (!clubId) return response.notFound({ error: 'CLUB_NOT_FOUND' })

        const limit = Number(request.qs().limit) || 20

        // Recent match performances
        const performances = await db
            .select({
                matchId: matchPlayerStats.matchId,
                minutesPlayed: matchPlayerStats.minutesPlayed,
                goals: matchPlayerStats.goals,
                assists: matchPlayerStats.assists,
                rating: matchPlayerStats.rating,
                matchday: matches.matchday,
                scheduledAt: matches.scheduledAt,
                homeClubId: matches.homeClubId,
                awayClubId: matches.awayClubId,
            })
            .from(matchPlayerStats)
            .innerJoin(matches, eq(matchPlayerStats.matchId, matches.id))
            .where(eq(matchPlayerStats.playerId, params.playerId))
            .orderBy(desc(matches.scheduledAt))
            .limit(limit)

        // Enrich with opponent names
        const clubIds = new Set<string>()
        for (const p of performances) {
            clubIds.add(p.homeClubId)
            clubIds.add(p.awayClubId)
        }
        const clubRows = clubIds.size > 0
            ? await db.select({ id: clubs.id, name: clubs.name }).from(clubs).where(inArray(clubs.id, [...clubIds]))
            : []
        const clubMap = new Map(clubRows.map((c) => [c.id, c.name]))

        // Overall history
        const overallHistory = await db
            .select({ matchday: playerOverallHistory.matchday, overall: playerOverallHistory.overall })
            .from(playerOverallHistory)
            .where(eq(playerOverallHistory.playerId, params.playerId))
            .orderBy(asc(playerOverallHistory.matchday))
            .limit(40)

        return response.ok({
            performances: performances.map((p) => {
                const isHome = p.homeClubId === clubId
                const opponentId = isHome ? p.awayClubId : p.homeClubId
                return {
                    matchId: p.matchId,
                    matchday: p.matchday,
                    opponent: { name: clubMap.get(opponentId) ?? 'Unknown' },
                    minutesPlayed: p.minutesPlayed,
                    goals: p.goals,
                    assists: p.assists,
                    rating: p.rating,
                    date: p.scheduledAt.toISOString(),
                }
            }),
            overallHistory,
        })
    }

    async compare({ auth, request, response }: HttpContext) {
        const clubId = await getClubId(auth.userId)
        if (!clubId) return response.notFound({ error: 'CLUB_NOT_FOUND' })

        const playerIdsParam = request.qs().players as string
        if (!playerIdsParam) return response.badRequest({ error: 'Provide ?players=id1,id2' })

        const ids = playerIdsParam.split(',').slice(0, 2)
        if (ids.length !== 2) return response.badRequest({ error: 'Exactly 2 player IDs required' })

        const playerRows = await db.select().from(players).where(inArray(players.id, ids))
        if (playerRows.length !== 2) return response.notFound({ error: 'Players not found' })

        const result = await Promise.all(playerRows.map(async (player) => {
            const [stats] = await db.select().from(playerStats).where(eq(playerStats.playerId, player.id)).limit(1)
            const [gkStats] = await db.select().from(goalkeeperStats).where(eq(goalkeeperStats.playerId, player.id)).limit(1)

            return {
                id: player.id,
                firstName: player.firstName,
                lastName: player.lastName,
                position: player.position,
                overall: player.overall,
                potential: player.potential,
                age: player.age,
                nationality: player.nationality,
                fatigue: player.fatigue,
                weeklySalary: player.weeklySalary,
                contractMatchesRemaining: player.contractMatchesRemaining,
                marketValue: ValuationService.calculateMarketValue(
                    player.overall, player.age, player.potential,
                    player.position as any, player.contractMatchesRemaining,
                ),
                stats: stats ? {
                    pace: stats.pace, stamina: stats.stamina, strength: stats.strength, agility: stats.agility,
                    passing: stats.passing, shooting: stats.shooting, dribbling: stats.dribbling, crossing: stats.crossing, heading: stats.heading,
                    vision: stats.vision, composure: stats.composure, workRate: stats.workRate, positioning: stats.positioning,
                    tackling: stats.tackling, marking: stats.marking, penalties: stats.penalties, freeKick: stats.freeKick,
                } : null,
                goalkeeperStats: gkStats ? {
                    reflexes: gkStats.reflexes, diving: gkStats.diving, handling: gkStats.handling,
                    positioning: gkStats.positioning, kicking: gkStats.kicking, communication: gkStats.communication,
                } : null,
            }
        }))

        return response.ok({ players: result })
    }

    async extendContract({ auth, params, response }: HttpContext) {
        const clubId = await getClubId(auth.userId)
        if (!clubId) return response.notFound({ error: 'CLUB_NOT_FOUND' })

        const [player] = await db.select().from(players)
            .where(and(eq(players.id, params.playerId), eq(players.clubId, clubId)))
            .limit(1)

        if (!player) return response.notFound({ error: 'PLAYER_NOT_FOUND' })
        if (player.contractMatchesRemaining <= 0) {
            return response.badRequest({ error: 'Player is already a free agent' })
        }

        const signingBonus = player.overall * 10_000 // in cents (= overall × 100 G$)
        const [club] = await db.select().from(clubs).where(eq(clubs.id, clubId)).limit(1)
        if (!club || club.balance < signingBonus) {
            return response.badRequest({ error: 'Insufficient funds for signing bonus' })
        }

        // Deduct signing bonus
        await FinanceService.createTransaction(clubId, {
            type: 'other',
            amount: -signingBonus,
            description: `Contract extension: ${player.firstName} ${player.lastName}`,
            referenceId: player.id,
        })

        // Update contract
        const newSalary = player.overall * SALARY_BASE_PER_OVERALL + Math.floor(Math.random() * SALARY_RANDOM_BONUS_MAX)
        const marketValue = ValuationService.calculateMarketValue(
            player.overall, player.age, player.potential, player.position as any, 20,
        )
        const newClause = Math.round(marketValue * 2)

        await db.update(players).set({
            contractMatchesRemaining: player.contractMatchesRemaining + 20,
            weeklySalary: newSalary,
            releaseClause: newClause,
            updatedAt: new Date(),
        }).where(eq(players.id, player.id))

        const [updatedClub] = await db.select({ balance: clubs.balance }).from(clubs).where(eq(clubs.id, clubId)).limit(1)

        return response.ok({
            player: {
                contractMatchesRemaining: player.contractMatchesRemaining + 20,
                weeklySalary: newSalary,
                releaseClause: newClause,
            },
            signingBonus,
            club: { balanceAfter: updatedClub?.balance ?? 0 },
        })
    }

    async valuation({ params, response }: HttpContext) {
        const [player] = await db.select().from(players).where(eq(players.id, params.playerId)).limit(1)
        if (!player) return response.notFound({ error: 'PLAYER_NOT_FOUND' })

        const value = ValuationService.calculateMarketValue(
            player.overall, player.age, player.potential,
            player.position as any, player.contractMatchesRemaining,
        )

        return response.ok({ marketValue: value, overall: player.overall, age: player.age, potential: player.potential })
    }
}
