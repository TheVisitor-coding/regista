import { db } from '@regista/db'
import { matches, players, standings } from '@regista/db'
import { and, eq } from 'drizzle-orm'
import { FATIGUE_RECOVERY_PER_CYCLE } from '@regista/shared'

export async function updateStandings(match: typeof matches.$inferSelect) {
    if (match.homeScore === null || match.awayScore === null) return

    // Find the standing rows
    const [homeStanding] = await db.select().from(standings)
        .where(and(eq(standings.seasonId, match.seasonId), eq(standings.clubId, match.homeClubId)))
        .limit(1)
    const [awayStanding] = await db.select().from(standings)
        .where(and(eq(standings.seasonId, match.seasonId), eq(standings.clubId, match.awayClubId)))
        .limit(1)

    if (!homeStanding || !awayStanding) return

    const homeWin = match.homeScore > match.awayScore
    const draw = match.homeScore === match.awayScore
    const awayWin = match.awayScore > match.homeScore

    // Update home
    await db.update(standings).set({
        played: homeStanding.played + 1,
        won: homeStanding.won + (homeWin ? 1 : 0),
        drawn: homeStanding.drawn + (draw ? 1 : 0),
        lost: homeStanding.lost + (awayWin ? 1 : 0),
        goalsFor: homeStanding.goalsFor + match.homeScore,
        goalsAgainst: homeStanding.goalsAgainst + match.awayScore,
        goalDifference: homeStanding.goalDifference + match.homeScore - match.awayScore,
        points: homeStanding.points + (homeWin ? 3 : draw ? 1 : 0),
        homeWon: homeStanding.homeWon + (homeWin ? 1 : 0),
        homeDrawn: homeStanding.homeDrawn + (draw ? 1 : 0),
        homeLost: homeStanding.homeLost + (awayWin ? 1 : 0),
        form: updateForm(homeStanding.form, homeWin ? 'W' : draw ? 'D' : 'L'),
        updatedAt: new Date(),
    }).where(eq(standings.id, homeStanding.id))

    // Update away
    await db.update(standings).set({
        played: awayStanding.played + 1,
        won: awayStanding.won + (awayWin ? 1 : 0),
        drawn: awayStanding.drawn + (draw ? 1 : 0),
        lost: awayStanding.lost + (homeWin ? 1 : 0),
        goalsFor: awayStanding.goalsFor + match.awayScore,
        goalsAgainst: awayStanding.goalsAgainst + match.homeScore,
        goalDifference: awayStanding.goalDifference + match.awayScore - match.homeScore,
        points: awayStanding.points + (awayWin ? 3 : draw ? 1 : 0),
        awayWon: awayStanding.awayWon + (awayWin ? 1 : 0),
        awayDrawn: awayStanding.awayDrawn + (draw ? 1 : 0),
        awayLost: awayStanding.awayLost + (homeWin ? 1 : 0),
        form: updateForm(awayStanding.form, awayWin ? 'W' : draw ? 'D' : 'L'),
        updatedAt: new Date(),
    }).where(eq(standings.id, awayStanding.id))

    // Recalculate positions for the entire season
    await recalculatePositions(match.seasonId)
}

export function updateForm(currentForm: string, result: string): string {
    return (currentForm + result).slice(-5)
}

export async function recalculatePositions(seasonId: string) {
    const all = await db.select().from(standings)
        .where(eq(standings.seasonId, seasonId))

    // Sort: points desc, goal difference desc, goals for desc
    all.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference
        return b.goalsFor - a.goalsFor
    })

    for (let i = 0; i < all.length; i++) {
        if (all[i].position !== i + 1) {
            await db.update(standings).set({ position: i + 1 }).where(eq(standings.id, all[i].id))
        }
    }
}

export async function applyFatigue(clubId: string) {
    // Increase fatigue by 15-25 for all players (match fatigue)
    const clubPlayers = await db.select({ id: players.id, fatigue: players.fatigue })
        .from(players).where(eq(players.clubId, clubId))

    for (const p of clubPlayers) {
        const newFatigue = Math.min(100, p.fatigue + 15 + Math.floor(Math.random() * 10))
        await db.update(players).set({ fatigue: newFatigue, updatedAt: new Date() })
            .where(eq(players.id, p.id))
    }
}

export async function processInjuries(clubId: string) {
    const injured = await db.select({ id: players.id, remaining: players.injuryMatchesRemaining })
        .from(players).where(and(eq(players.clubId, clubId), eq(players.isInjured, true)))

    for (const p of injured) {
        const newRemaining = Math.max(0, p.remaining - 1)
        await db.update(players).set({
            injuryMatchesRemaining: newRemaining,
            isInjured: newRemaining > 0,
            injuryType: newRemaining > 0 ? undefined : null,
            updatedAt: new Date(),
        }).where(eq(players.id, p.id))
    }
}

export async function processSuspensions(clubId: string) {
    // Decrement suspension
    const suspended = await db.select({ id: players.id, remaining: players.suspensionMatchesRemaining })
        .from(players).where(and(eq(players.clubId, clubId), eq(players.isSuspended, true)))

    for (const p of suspended) {
        const newRemaining = Math.max(0, p.remaining - 1)
        await db.update(players).set({
            suspensionMatchesRemaining: newRemaining,
            isSuspended: newRemaining > 0,
            updatedAt: new Date(),
        }).where(eq(players.id, p.id))
    }

    // Check yellow card accumulation (5 yellows = 1 match ban)
    const yellowRisk = await db.select({ id: players.id, yellows: players.yellowCardsSeason })
        .from(players).where(and(eq(players.clubId, clubId), eq(players.isSuspended, false)))

    for (const p of yellowRisk) {
        if (p.yellows >= 5 && p.yellows % 5 === 0) {
            await db.update(players).set({
                isSuspended: true,
                suspensionMatchesRemaining: 1,
                updatedAt: new Date(),
            }).where(eq(players.id, p.id))
        }
    }
}

export async function applyFatigueRecovery(clubId: string) {
    const clubPlayers = await db.select({ id: players.id, fatigue: players.fatigue })
        .from(players).where(eq(players.clubId, clubId))

    for (const p of clubPlayers) {
        const newFatigue = Math.max(0, p.fatigue - FATIGUE_RECOVERY_PER_CYCLE)
        if (newFatigue !== p.fatigue) {
            await db.update(players).set({ fatigue: newFatigue, updatedAt: new Date() })
                .where(eq(players.id, p.id))
        }
    }
}
