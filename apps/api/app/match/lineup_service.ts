import { db } from '@regista/db'
import { matchLineups, matchTacticalChanges } from '@regista/db'
import type { TacticConfig } from '@regista/shared'

// Formation positions (RM, LM) that aren't valid DB player positions
const POSITION_DB_MAP: Record<string, string> = {
    RM: 'RW',
    LM: 'LW',
}

function toDbPosition(pos: string): string {
    return POSITION_DB_MAP[pos] ?? pos
}

export class LineupService {
    static async saveLineup(
        matchId: string,
        clubId: string,
        startingXI: Array<{ playerId: string; position: string }>,
        bench: Array<{ playerId: string; position: string }>,
    ) {
        const values = [
            ...startingXI.map((p) => ({
                matchId,
                clubId,
                playerId: p.playerId,
                position: toDbPosition(p.position) as any,
                isStarter: true,
                minuteIn: 0,
            })),
            ...bench.map((p) => ({
                matchId,
                clubId,
                playerId: p.playerId,
                position: toDbPosition(p.position) as any,
                isStarter: false,
                minuteIn: 0,
            })),
        ]

        if (values.length > 0) {
            await db.insert(matchLineups).values(values)
        }
    }

    static async saveTactics(
        matchId: string,
        clubId: string,
        tactics: TacticConfig,
        minute: number = 0,
    ) {
        await db.insert(matchTacticalChanges).values({
            matchId,
            clubId,
            minute,
            formation: tactics.formation,
            mentality: tactics.mentality as any,
            pressing: tactics.pressing as any,
            passingStyle: tactics.passingStyle as any,
            width: tactics.width as any,
            tempo: tactics.tempo as any,
            defensiveLine: tactics.defensiveLine as any,
        })
    }
}
