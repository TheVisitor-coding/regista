import type { HttpContext } from '@adonisjs/core/http'
import { db } from '@regista/db'
import { clubs, tacticalPresets, clubTactics, clubCompositions, players, matches } from '@regista/db'
import { and, asc, count, desc, eq, inArray, or } from 'drizzle-orm'
import vine from '@vinejs/vine'
import { AutoLineupService } from '../match/auto_lineup_service.js'
import { FORMATIONS } from '@regista/shared'

const updateTacticsValidator = vine.compile(
    vine.object({
        formation: vine.string().optional(),
        mentality: vine.string().in(['ultra_defensive', 'defensive', 'balanced', 'offensive', 'ultra_offensive']).optional(),
        pressing: vine.string().in(['low', 'medium', 'high']).optional(),
        passingStyle: vine.string().in(['short', 'mixed', 'long']).optional(),
        width: vine.string().in(['narrow', 'normal', 'wide']).optional(),
        tempo: vine.string().in(['slow', 'normal', 'fast']).optional(),
        defensiveLine: vine.string().in(['low', 'medium', 'high']).optional(),
    }),
)

const createPresetValidator = vine.compile(
    vine.object({
        name: vine.string().trim().minLength(1).maxLength(20),
        formation: vine.string(),
        mentality: vine.string().in(['ultra_defensive', 'defensive', 'balanced', 'offensive', 'ultra_offensive']),
        pressing: vine.string().in(['low', 'medium', 'high']),
        passingStyle: vine.string().in(['short', 'mixed', 'long']),
        width: vine.string().in(['narrow', 'normal', 'wide']),
        tempo: vine.string().in(['slow', 'normal', 'fast']),
        defensiveLine: vine.string().in(['low', 'medium', 'high']),
    }),
)

const compositionValidator = vine.compile(
    vine.object({
        formation: vine.string(),
        startingXI: vine.array(vine.object({
            playerId: vine.string().uuid(),
            position: vine.string(),
        })).minLength(11).maxLength(11),
        bench: vine.array(vine.object({
            playerId: vine.string().uuid(),
            position: vine.string(),
        })).maxLength(7),
        captainId: vine.string().uuid().optional(),
        penaltyTakerId: vine.string().uuid().optional(),
        freeKickTakerId: vine.string().uuid().optional(),
        cornerLeftTakerId: vine.string().uuid().optional(),
        cornerRightTakerId: vine.string().uuid().optional(),
    }),
)

async function getClubId(userId: string): Promise<string | null> {
    const [club] = await db.select({ id: clubs.id }).from(clubs).where(eq(clubs.userId, userId)).limit(1)
    return club?.id ?? null
}

const DEFAULT_TACTICS = {
    formation: '4-4-2',
    mentality: 'balanced',
    pressing: 'medium',
    passingStyle: 'mixed',
    width: 'normal',
    tempo: 'normal',
    defensiveLine: 'medium',
}

function calculateCoherence(
    startingXI: Array<{ playerId: string; position: string; compatibility: number; fatigue: number }>,
    bench: Array<{ position: string }>,
    warnings: string[],
): number {
    // Position compatibility (40%)
    const compatAvg = startingXI.length > 0
        ? startingXI.reduce((sum, p) => sum + p.compatibility * 100, 0) / startingXI.length
        : 0

    // Freshness (30%)
    const fatigueAvg = startingXI.length > 0
        ? startingXI.reduce((sum, p) => sum + p.fatigue, 0) / startingXI.length
        : 0
    const freshness = 100 - fatigueAvg

    // Bench diversity (15%)
    const benchLines: string[] = bench.map((b): string => {
        if (b.position === 'GK') return 'GK'
        if (['CB', 'LB', 'RB'].includes(b.position)) return 'DEF'
        if (['CDM', 'CM', 'CAM', 'LM', 'RM'].includes(b.position)) return 'MID'
        return 'ATT'
    })
    const diversityNeeded = ['GK', 'DEF', 'MID', 'ATT']
    const diversityScore = (diversityNeeded.filter((d) => benchLines.includes(d)).length / 4) * 100

    // Warnings penalty (15%)
    const warningPenalty = Math.min(warnings.length * 10, 100)

    return Math.round(
        compatAvg * 0.40 +
        freshness * 0.30 +
        diversityScore * 0.15 +
        (100 - warningPenalty) * 0.15,
    )
}

export default class TacticsController {
    // === Current tactics (Redis-cached) ===

    async show({ auth, response }: HttpContext) {
        const clubId = await getClubId(auth.userId)
        if (!clubId) return response.notFound({ error: 'CLUB_NOT_FOUND' })

        const [row] = await db.select({
            formation: clubTactics.formation,
            mentality: clubTactics.mentality,
            pressing: clubTactics.pressing,
            passingStyle: clubTactics.passingStyle,
            width: clubTactics.width,
            tempo: clubTactics.tempo,
            defensiveLine: clubTactics.defensiveLine,
        }).from(clubTactics).where(eq(clubTactics.clubId, clubId)).limit(1)

        return response.ok(row ?? DEFAULT_TACTICS)
    }

    async update({ auth, request, response }: HttpContext) {
        const clubId = await getClubId(auth.userId)
        if (!clubId) return response.notFound({ error: 'CLUB_NOT_FOUND' })

        const data = await updateTacticsValidator.validate(request.all()) as Record<string, any>

        const [upserted] = await db.insert(clubTactics)
            .values({ clubId, ...data })
            .onConflictDoUpdate({
                target: clubTactics.clubId,
                set: { ...data, updatedAt: new Date() },
            })
            .returning({
                formation: clubTactics.formation,
                mentality: clubTactics.mentality,
                pressing: clubTactics.pressing,
                passingStyle: clubTactics.passingStyle,
                width: clubTactics.width,
                tempo: clubTactics.tempo,
                defensiveLine: clubTactics.defensiveLine,
            })

        return response.ok(upserted)
    }

    // === Presets ===

    async listPresets({ auth, response }: HttpContext) {
        const clubId = await getClubId(auth.userId)
        if (!clubId) return response.notFound({ error: 'CLUB_NOT_FOUND' })

        const presets = await db.select().from(tacticalPresets)
            .where(eq(tacticalPresets.clubId, clubId))
            .orderBy(desc(tacticalPresets.isDefault), asc(tacticalPresets.createdAt))

        return response.ok({ presets })
    }

    async createPreset({ auth, request, response }: HttpContext) {
        const clubId = await getClubId(auth.userId)
        if (!clubId) return response.notFound({ error: 'CLUB_NOT_FOUND' })

        const data = await createPresetValidator.validate(request.all())

        // Max 8 presets
        const [presetCount] = await db.select({ value: count(tacticalPresets.id) })
            .from(tacticalPresets).where(eq(tacticalPresets.clubId, clubId))
        if ((presetCount?.value ?? 0) >= 8) {
            return response.badRequest({ error: 'Maximum 8 presets' })
        }

        const [preset] = await db.insert(tacticalPresets).values({
            clubId,
            name: data.name,
            formation: data.formation,
            mentality: data.mentality as any,
            pressing: data.pressing as any,
            passingStyle: data.passingStyle as any,
            width: data.width as any,
            tempo: data.tempo as any,
            defensiveLine: data.defensiveLine as any,
        }).returning()

        return response.created({ preset })
    }

    async updatePreset({ auth, params, request, response }: HttpContext) {
        const clubId = await getClubId(auth.userId)
        if (!clubId) return response.notFound({ error: 'CLUB_NOT_FOUND' })

        const data = await createPresetValidator.validate(request.all())

        const [preset] = await db.select().from(tacticalPresets)
            .where(and(eq(tacticalPresets.id, params.id), eq(tacticalPresets.clubId, clubId)))
            .limit(1)
        if (!preset) return response.notFound({ error: 'PRESET_NOT_FOUND' })

        const [updated] = await db.update(tacticalPresets).set({
            name: data.name,
            formation: data.formation,
            mentality: data.mentality as any,
            pressing: data.pressing as any,
            passingStyle: data.passingStyle as any,
            width: data.width as any,
            tempo: data.tempo as any,
            defensiveLine: data.defensiveLine as any,
            updatedAt: new Date(),
        }).where(eq(tacticalPresets.id, params.id)).returning()

        return response.ok({ preset: updated })
    }

    async deletePreset({ auth, params, response }: HttpContext) {
        const clubId = await getClubId(auth.userId)
        if (!clubId) return response.notFound({ error: 'CLUB_NOT_FOUND' })

        const [preset] = await db.select().from(tacticalPresets)
            .where(and(eq(tacticalPresets.id, params.id), eq(tacticalPresets.clubId, clubId)))
            .limit(1)
        if (!preset) return response.notFound({ error: 'PRESET_NOT_FOUND' })
        if (preset.isDefault) return response.badRequest({ error: 'Cannot delete default preset' })

        await db.delete(tacticalPresets).where(eq(tacticalPresets.id, params.id))
        return response.ok({ success: true })
    }

    async applyPreset({ auth, params, response }: HttpContext) {
        const clubId = await getClubId(auth.userId)
        if (!clubId) return response.notFound({ error: 'CLUB_NOT_FOUND' })

        const [preset] = await db.select().from(tacticalPresets)
            .where(and(eq(tacticalPresets.id, params.id), eq(tacticalPresets.clubId, clubId)))
            .limit(1)
        if (!preset) return response.notFound({ error: 'PRESET_NOT_FOUND' })

        // Apply tactics to PostgreSQL
        const tactics = {
            formation: preset.formation,
            mentality: preset.mentality,
            pressing: preset.pressing,
            passingStyle: preset.passingStyle,
            width: preset.width,
            tempo: preset.tempo,
            defensiveLine: preset.defensiveLine,
        }
        await db.insert(clubTactics)
            .values({ clubId, ...tactics })
            .onConflictDoUpdate({
                target: clubTactics.clubId,
                set: { ...tactics, updatedAt: new Date() },
            })

        // Auto-lineup with new formation
        const eligible = await AutoLineupService.getEligiblePlayers(clubId)
        const xi = AutoLineupService.selectStartingXI(eligible, preset.formation)
        const xiIds = new Set(xi.map((p) => p.playerId))
        const bench = AutoLineupService.selectBench(eligible, xiIds)

        return response.ok({
            tactics,
            startingXI: xi,
            bench,
        })
    }

    // === Auto-Lineup ===

    async autoLineup({ auth, request, response }: HttpContext) {
        const clubId = await getClubId(auth.userId)
        if (!clubId) return response.notFound({ error: 'CLUB_NOT_FOUND' })

        const formation = (request.qs().formation as string) ?? '4-4-2'
        if (!FORMATIONS[formation]) {
            return response.badRequest({ error: 'INVALID_FORMATION' })
        }

        const eligible = await AutoLineupService.getEligiblePlayers(clubId)
        const xi = AutoLineupService.selectStartingXI(eligible, formation)
        const xiIds = new Set(xi.map((p) => p.playerId))
        const bench = AutoLineupService.selectBench(eligible, xiIds)

        // Enrich with player data
        const allPlayerIds = [...xi.map((p) => p.playerId), ...bench.map((p) => p.playerId)]
        const playerRows = allPlayerIds.length > 0
            ? await db.select({
                id: players.id,
                firstName: players.firstName,
                lastName: players.lastName,
                position: players.position,
                overall: players.overall,
                fatigue: players.fatigue,
                isInjured: players.isInjured,
                isSuspended: players.isSuspended,
            }).from(players).where(inArray(players.id, allPlayerIds))
            : []

        const playerMap = new Map(playerRows.map((p) => [p.id, p]))

        const enrichedXI = xi.map((slot) => {
            const p = playerMap.get(slot.playerId)
            const isNatural = p?.position === slot.position
            const isSecondary = false // Simplified
            const compatibility = isNatural ? 1.0 : isSecondary ? 0.85 : 0.7
            return {
                ...slot,
                playerName: p ? `${p.firstName} ${p.lastName}` : 'Unknown',
                naturalPosition: p?.position ?? slot.position,
                overall: p?.overall ?? 50,
                fatigue: p?.fatigue ?? 0,
                compatibility,
            }
        })

        const enrichedBench = bench.map((slot) => {
            const p = playerMap.get(slot.playerId)
            return {
                ...slot,
                playerName: p ? `${p.firstName} ${p.lastName}` : 'Unknown',
                naturalPosition: p?.position ?? slot.position,
                overall: p?.overall ?? 50,
                fatigue: p?.fatigue ?? 0,
            }
        })

        const warnings: string[] = []
        if (!bench.find((b) => b.position === 'GK')) warnings.push('No backup GK on bench')
        for (const p of enrichedXI) {
            if (p.fatigue > 80) warnings.push(`${p.playerName} fatigue > 80%`)
            if (p.compatibility < 0.75) warnings.push(`${p.playerName} out of position`)
        }

        const coherence = calculateCoherence(enrichedXI, enrichedBench, warnings)

        return response.ok({
            startingXI: enrichedXI,
            bench: enrichedBench,
            coherence,
            warnings,
        })
    }

    // === Composition (save/load) ===

    async getComposition({ auth, response }: HttpContext) {
        const clubId = await getClubId(auth.userId)
        if (!clubId) return response.notFound({ error: 'CLUB_NOT_FOUND' })

        const [saved] = await db.select().from(clubCompositions)
            .where(eq(clubCompositions.clubId, clubId)).limit(1)
        if (saved) {
            // Enrich saved composition with player data
            const allPlayerIds = [
                ...saved.startingXI.map((p) => p.playerId),
                ...saved.bench.map((p) => p.playerId),
            ]
            const playerRows = allPlayerIds.length > 0
                ? await db.select({
                    id: players.id, firstName: players.firstName, lastName: players.lastName,
                    position: players.position, overall: players.overall, fatigue: players.fatigue,
                }).from(players).where(inArray(players.id, allPlayerIds))
                : []
            const playerMap = new Map(playerRows.map((p) => [p.id, p]))

            const enrichedXI = saved.startingXI.map((slot) => {
                const p = playerMap.get(slot.playerId)
                return {
                    ...slot,
                    playerName: p ? `${p.firstName} ${p.lastName}` : 'Unknown',
                    naturalPosition: p?.position ?? slot.position,
                    overall: p?.overall ?? 50,
                    fatigue: p?.fatigue ?? 0,
                    compatibility: p?.position === slot.position ? 1.0 : 0.7,
                }
            })
            const enrichedBench = saved.bench.map((slot) => {
                const p = playerMap.get(slot.playerId)
                return {
                    ...slot,
                    playerName: p ? `${p.firstName} ${p.lastName}` : 'Unknown',
                    naturalPosition: p?.position ?? slot.position,
                    overall: p?.overall ?? 50,
                    fatigue: p?.fatigue ?? 0,
                }
            })

            return response.ok({
                formation: saved.formation,
                startingXI: enrichedXI,
                bench: enrichedBench,
                captainId: saved.captainId,
                penaltyTakerId: saved.penaltyTakerId,
                freeKickTakerId: saved.freeKickTakerId,
                cornerLeftTakerId: saved.cornerLeftTakerId,
                cornerRightTakerId: saved.cornerRightTakerId,
                coherence: saved.coherence,
                warnings: saved.warnings,
            })
        }

        // No saved composition — generate auto-lineup with enriched data
        const [tacticsRow] = await db.select({ formation: clubTactics.formation })
            .from(clubTactics).where(eq(clubTactics.clubId, clubId)).limit(1)
        const formation = tacticsRow?.formation ?? '4-4-2'

        const eligible = await AutoLineupService.getEligiblePlayers(clubId)
        const xi = AutoLineupService.selectStartingXI(eligible, formation)
        const xiIds = new Set(xi.map((p) => p.playerId))
        const bench = AutoLineupService.selectBench(eligible, xiIds)

        // Enrich with player names and data
        const allPlayerIds = [...xi.map((p) => p.playerId), ...bench.map((p) => p.playerId)]
        const playerRows = allPlayerIds.length > 0
            ? await db.select({
                id: players.id, firstName: players.firstName, lastName: players.lastName,
                position: players.position, overall: players.overall, fatigue: players.fatigue,
            }).from(players).where(inArray(players.id, allPlayerIds))
            : []
        const playerMap = new Map(playerRows.map((p) => [p.id, p]))

        const enrichedXI = xi.map((slot) => {
            const p = playerMap.get(slot.playerId)
            return {
                ...slot,
                playerName: p ? `${p.firstName} ${p.lastName}` : 'Unknown',
                naturalPosition: p?.position ?? slot.position,
                overall: p?.overall ?? 50,
                fatigue: p?.fatigue ?? 0,
                compatibility: p?.position === slot.position ? 1.0 : 0.7,
            }
        })
        const enrichedBench = bench.map((slot) => {
            const p = playerMap.get(slot.playerId)
            return {
                ...slot,
                playerName: p ? `${p.firstName} ${p.lastName}` : 'Unknown',
                naturalPosition: p?.position ?? slot.position,
                overall: p?.overall ?? 50,
                fatigue: p?.fatigue ?? 0,
            }
        })

        return response.ok({ formation, startingXI: enrichedXI, bench: enrichedBench, coherence: 70, warnings: [] })
    }

    async saveComposition({ auth, request, response }: HttpContext) {
        const clubId = await getClubId(auth.userId)
        if (!clubId) return response.notFound({ error: 'CLUB_NOT_FOUND' })

        const data = await compositionValidator.validate(request.all())

        // Validate all players belong to club
        const playerIds = [...data.startingXI.map((p) => p.playerId), ...data.bench.map((p) => p.playerId)]
        const clubPlayers = await db.select({ id: players.id, position: players.position, fatigue: players.fatigue })
            .from(players).where(and(eq(players.clubId, clubId), inArray(players.id, playerIds)))

        if (clubPlayers.length !== playerIds.length) {
            return response.badRequest({ error: 'Some players do not belong to your club' })
        }

        // Calculate coherence
        const playerMap = new Map(clubPlayers.map((p) => [p.id, p]))
        const xiWithData = data.startingXI.map((slot) => {
            const p = playerMap.get(slot.playerId)
            return {
                ...slot,
                compatibility: p?.position === slot.position ? 1.0 : 0.7,
                fatigue: p?.fatigue ?? 0,
            }
        })
        const warnings: string[] = []
        if (!data.bench.find((b) => b.position === 'GK')) warnings.push('No backup GK on bench')
        const coherence = calculateCoherence(xiWithData, data.bench, warnings)

        // Save to PostgreSQL
        await db.insert(clubCompositions)
            .values({
                clubId,
                formation: data.formation,
                startingXI: data.startingXI,
                bench: data.bench,
                captainId: data.captainId ?? null,
                penaltyTakerId: data.penaltyTakerId ?? null,
                freeKickTakerId: data.freeKickTakerId ?? null,
                cornerLeftTakerId: data.cornerLeftTakerId ?? null,
                cornerRightTakerId: data.cornerRightTakerId ?? null,
                coherence,
                warnings,
            })
            .onConflictDoUpdate({
                target: clubCompositions.clubId,
                set: {
                    formation: data.formation,
                    startingXI: data.startingXI,
                    bench: data.bench,
                    captainId: data.captainId ?? null,
                    penaltyTakerId: data.penaltyTakerId ?? null,
                    freeKickTakerId: data.freeKickTakerId ?? null,
                    cornerLeftTakerId: data.cornerLeftTakerId ?? null,
                    cornerRightTakerId: data.cornerRightTakerId ?? null,
                    coherence,
                    warnings,
                    updatedAt: new Date(),
                },
            })

        return response.ok({ coherence, warnings })
    }

    // === Auto-adjustment toggle ===

    async toggleAutoAdjustment({ auth, request, response }: HttpContext) {
        const clubId = await getClubId(auth.userId)
        if (!clubId) return response.notFound({ error: 'CLUB_NOT_FOUND' })

        const { enabled } = request.all() as { enabled: boolean }

        await db.update(clubs).set({ autoAdjustment: !!enabled, updatedAt: new Date() })
            .where(eq(clubs.id, clubId))

        return response.ok({ autoAdjustment: !!enabled })
    }

    // === Pre-match analysis ===

    async analysis({ auth, params, response }: HttpContext) {
        const clubId = await getClubId(auth.userId)
        if (!clubId) return response.notFound({ error: 'CLUB_NOT_FOUND' })

        const [match] = await db.select().from(matches)
            .where(eq(matches.id, params.matchId)).limit(1)
        if (!match) return response.notFound({ error: 'MATCH_NOT_FOUND' })

        const opponentId = match.homeClubId === clubId ? match.awayClubId : match.homeClubId

        const [opponent] = await db.select({
            id: clubs.id,
            name: clubs.name,
            primaryColor: clubs.primaryColor,
        }).from(clubs).where(eq(clubs.id, opponentId)).limit(1)

        if (!opponent) return response.notFound({ error: 'OPPONENT_NOT_FOUND' })

        // Get opponent recent results
        const recentMatches = await db.select().from(matches)
            .where(and(
                or(eq(matches.homeClubId, opponentId), eq(matches.awayClubId, opponentId)),
                eq(matches.status, 'finished'),
            ))
            .orderBy(desc(matches.finishedAt))
            .limit(5)

        const recentForm = recentMatches.map((m) => {
            const isHome = m.homeClubId === opponentId
            const scored = isHome ? m.homeScore ?? 0 : m.awayScore ?? 0
            const conceded = isHome ? m.awayScore ?? 0 : m.homeScore ?? 0
            if (scored > conceded) return 'W'
            if (scored === conceded) return 'D'
            return 'L'
        })

        const goalsScored = recentMatches.reduce((sum, m) => {
            const isHome = m.homeClubId === opponentId
            return sum + (isHome ? m.homeScore ?? 0 : m.awayScore ?? 0)
        }, 0)
        const goalsConceded = recentMatches.reduce((sum, m) => {
            const isHome = m.homeClubId === opponentId
            return sum + (isHome ? m.awayScore ?? 0 : m.homeScore ?? 0)
        }, 0)

        // Get opponent player overalls by line
        const opponentPlayers = await db.select({
            position: players.position,
            overall: players.overall,
        }).from(players).where(eq(players.clubId, opponentId))

        const lineOveralls: Record<string, number> = { defense: 0, midfield: 0, attack: 0 }
        const lineCounts: Record<string, number> = { defense: 0, midfield: 0, attack: 0 }

        for (const p of opponentPlayers) {
            if (['CB', 'LB', 'RB'].includes(p.position)) {
                lineOveralls.defense += p.overall; lineCounts.defense++
            } else if (['CDM', 'CM', 'CAM'].includes(p.position)) {
                lineOveralls.midfield += p.overall; lineCounts.midfield++
            } else if (['ST', 'CF', 'LW', 'RW'].includes(p.position)) {
                lineOveralls.attack += p.overall; lineCounts.attack++
            }
        }

        for (const line of ['defense', 'midfield', 'attack']) {
            lineOveralls[line] = lineCounts[line] > 0
                ? Math.round(lineOveralls[line] / lineCounts[line])
                : 50
        }

        // Generate suggestion
        let suggestion: { text: string; suggestedPreset: string }
        if (lineOveralls.defense < lineOveralls.attack - 10) {
            suggestion = {
                text: `Leur défense est faible (${lineOveralls.defense}). Attaquez avec insistance.`,
                suggestedPreset: 'offensive',
            }
        } else if (recentForm.filter((r) => r === 'W').length <= 1) {
            suggestion = {
                text: `Adversaire en méforme. Pressing haut pour en profiter.`,
                suggestedPreset: 'offensive',
            }
        } else if (lineOveralls.attack > lineOveralls.defense + 10) {
            suggestion = {
                text: `Attaque dangereuse (${lineOveralls.attack}). Solidité défensive recommandée.`,
                suggestedPreset: 'defensive',
            }
        } else {
            suggestion = {
                text: `Adversaire équilibré. Jouez votre jeu.`,
                suggestedPreset: 'balanced',
            }
        }

        return response.ok({
            opponent: {
                id: opponent.id,
                name: opponent.name,
                primaryColor: opponent.primaryColor,
                recentForm,
                recentGoalsScored: goalsScored,
                recentGoalsConceded: goalsConceded,
                lineOveralls,
            },
            suggestion: {
                ...suggestion,
                staffRole: 'assistant',
            },
        })
    }
}
