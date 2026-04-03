import { db } from '@regista/db'
import { standings, clubs } from '@regista/db'
import { asc, eq } from 'drizzle-orm'
import { PROMOTION_ZONE, RELEGATION_ZONE_START } from '@regista/shared'

export class StandingsService {
    static async initializeStandings(seasonId: string, clubIds: string[]) {
        await db.insert(standings).values(
            clubIds.map((clubId, index) => ({
                seasonId,
                clubId,
                position: index + 1,
            })),
        )
    }

    static async getStandings(seasonId: string, userClubId?: string) {
        const rows = await db
            .select({
                standing: standings,
                club: {
                    id: clubs.id,
                    name: clubs.name,
                    logoId: clubs.logoId,
                    primaryColor: clubs.primaryColor,
                },
            })
            .from(standings)
            .innerJoin(clubs, eq(standings.clubId, clubs.id))
            .where(eq(standings.seasonId, seasonId))
            .orderBy(asc(standings.position))

        return rows.map((row) => {
            let zone: 'champion' | 'promotion' | 'neutral' | 'relegation'
            if (row.standing.position === 1) zone = 'champion'
            else if (row.standing.position <= PROMOTION_ZONE) zone = 'promotion'
            else if (row.standing.position >= RELEGATION_ZONE_START) zone = 'relegation'
            else zone = 'neutral'

            return {
                ...row.standing,
                updatedAt: row.standing.updatedAt.toISOString(),
                club: row.club,
                zone,
                isCurrentClub: row.club.id === userClubId,
            }
        })
    }
}
