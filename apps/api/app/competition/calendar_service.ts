import { db } from '@regista/db'
import { matches } from '@regista/db'
import { MATCH_FREQUENCY_DAYS } from '@regista/shared'

/**
 * Round-robin calendar generation.
 * Given N clubs (must be even), generates N-1 rounds for the first half,
 * then N-1 return rounds with swapped home/away.
 * Total: 2*(N-1) = 38 matchdays for 20 clubs.
 */
export class CalendarService {
    static async generateCalendar(
        seasonId: string,
        clubIds: string[],
        matchTime: string,
        startDate: Date,
    ): Promise<number> {
        const n = clubIds.length
        if (n % 2 !== 0 || n < 2) {
            throw new Error(`Need even number of clubs, got ${n}`)
        }

        const rounds = n - 1 // 19 rounds per half
        const matchesPerRound = n / 2

        // Build rotation array: fix first club, rotate rest
        const fixed = clubIds[0]
        const rotating = clubIds.slice(1) // 19 clubs

        const allMatches: Array<{
            seasonId: string
            matchday: number
            homeClubId: string
            awayClubId: string
            scheduledAt: Date
        }> = []

        for (let round = 0; round < rounds; round++) {
            const matchday = round + 1
            const scheduledAt = CalendarService.computeMatchDate(startDate, matchday, matchTime)

            // Pair fixed club with rotating[0]
            // Alternate home/away for the fixed club each round
            if (round % 2 === 0) {
                allMatches.push({
                    seasonId,
                    matchday,
                    homeClubId: fixed,
                    awayClubId: rotating[0],
                    scheduledAt,
                })
            } else {
                allMatches.push({
                    seasonId,
                    matchday,
                    homeClubId: rotating[0],
                    awayClubId: fixed,
                    scheduledAt,
                })
            }

            // Pair remaining: rotating[i] with rotating[n-2-i]
            for (let i = 1; i < matchesPerRound; i++) {
                const home = rotating[i]
                const away = rotating[rotating.length - i]
                allMatches.push({
                    seasonId,
                    matchday,
                    homeClubId: home,
                    awayClubId: away,
                    scheduledAt,
                })
            }

            // Rotate: move last element to position 0
            rotating.unshift(rotating.pop()!)
        }

        // Return leg: swap home/away, matchdays 20-38
        const firstHalf = allMatches.length
        for (let i = 0; i < firstHalf; i++) {
            const original = allMatches[i]
            const returnMatchday = original.matchday + rounds
            const scheduledAt = CalendarService.computeMatchDate(startDate, returnMatchday, matchTime)

            allMatches.push({
                seasonId,
                matchday: returnMatchday,
                homeClubId: original.awayClubId,
                awayClubId: original.homeClubId,
                scheduledAt,
            })
        }

        // Batch insert all matches
        const BATCH_SIZE = 50
        for (let i = 0; i < allMatches.length; i += BATCH_SIZE) {
            const batch = allMatches.slice(i, i + BATCH_SIZE)
            await db.insert(matches).values(batch)
        }

        return allMatches.length
    }

    private static computeMatchDate(startDate: Date, matchday: number, matchTime: string): Date {
        const [hours, minutes] = matchTime.split(':').map(Number)
        const date = new Date(startDate)
        date.setDate(date.getDate() + (matchday - 1) * MATCH_FREQUENCY_DAYS)
        date.setUTCHours(hours, minutes, 0, 0)
        return date
    }
}
