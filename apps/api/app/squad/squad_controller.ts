import type { HttpContext } from '@adonisjs/core/http'
import { db } from '@regista/db'
import { clubs, players, playerStats, goalkeeperStats } from '@regista/db'
import { asc, desc, eq, inArray } from 'drizzle-orm'
import { listSquadValidator } from './squad_validator.js'

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
        })
    }
}
