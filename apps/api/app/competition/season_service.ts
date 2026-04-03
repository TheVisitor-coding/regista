import { db } from '@regista/db'
import { seasons } from '@regista/db'
import { and, eq, ne } from 'drizzle-orm'

export class SeasonService {
    static async createSeason(divisionId: string, number: number): Promise<string> {
        const [season] = await db
            .insert(seasons)
            .values({
                divisionId,
                number,
                status: 'created',
                totalMatchdays: 38,
                currentMatchday: 0,
            })
            .returning()

        return season.id
    }

    static async startSeason(seasonId: string) {
        await db
            .update(seasons)
            .set({
                status: 'in_progress',
                startedAt: new Date(),
                currentMatchday: 1,
            })
            .where(eq(seasons.id, seasonId))
    }

    static async getActiveSeason(divisionId: string) {
        const [season] = await db
            .select()
            .from(seasons)
            .where(
                and(
                    eq(seasons.divisionId, divisionId),
                    ne(seasons.status, 'archived'),
                ),
            )
            .limit(1)

        return season ?? null
    }
}
