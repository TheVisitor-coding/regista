import { db } from '@regista/db'
import { players, playerStats, goalkeeperStats } from '@regista/db'
import {
    SQUAD_INITIAL_SIZE,
    SQUAD_INITIAL_OVERALL_MIN,
    SQUAD_INITIAL_OVERALL_MAX,
    SQUAD_INITIAL_CONTRACT_MATCHES,
    SALARY_BASE_PER_OVERALL,
    SALARY_RANDOM_BONUS_MAX,
} from '@regista/shared'
import { type PlayerPosition, POSITION_WEIGHTS } from '@regista/shared'

const INITIAL_SQUAD_DISTRIBUTION: PlayerPosition[] = [
    'GK', 'GK',
    'CB', 'CB', 'LB', 'RB',
    'CDM', 'CM', 'CM', 'CAM',
    'LW', 'RW', 'ST', 'ST',
    // Fill slots (mix of positions)
    'CB', 'RB', 'CM', 'CDM', 'CAM', 'LW', 'ST', 'CF',
]

const FIRST_NAMES = [
    'Lucas', 'Mateo', 'Hugo', 'Leo', 'Nolan', 'Samir', 'Rayan', 'Adam',
    'Youssef', 'Gabriel', 'Noah', 'Ethan', 'Jules', 'Arthur', 'Louis',
    'Nathan', 'Liam', 'Axel', 'Aaron', 'Tom', 'Enzo', 'Raphael',
    'Theo', 'Maxime', 'Kylian', 'Ismail', 'Diego', 'Marco', 'Andrei',
    'Pavel', 'Takumi', 'Jin', 'Carlos', 'Pedro', 'Giovanni', 'Ahmed',
    'Felix', 'Oscar', 'Emil', 'Lars', 'Sven', 'Kai', 'Malik',
    'Olivier', 'Baptiste', 'Damien', 'Romain', 'Pierre', 'Antoine', 'Yann',
]

const LAST_NAMES = [
    'Martin', 'Bernard', 'Durand', 'Moreau', 'Petit', 'Robert', 'Simon',
    'Laurent', 'Michel', 'Garcia', 'Lopez', 'Martinez', 'Rodriguez', 'Rossi',
    'Bianchi', 'Müller', 'Schmidt', 'Weber', 'Wagner', 'Fischer',
    'Andersen', 'Johansson', 'Petrov', 'Kovac', 'Silva', 'Santos',
    'Fernandez', 'Gonzalez', 'Hernandez', 'Torres', 'Diaz', 'Cruz',
    'Nakamura', 'Tanaka', 'Ali', 'Hassan', 'Ibrahim', 'Chen', 'Wang',
    'Kim', 'Park', 'Eriksen', 'Larsen', 'Bakker', 'Jansen', 'De Jong',
    'Dubois', 'Leroy', 'Girard', 'Morel', 'Fournier',
]

const NATIONALITIES = [
    'FRA', 'ESP', 'ITA', 'DEU', 'BRA', 'ARG', 'PRT', 'NLD',
    'BEL', 'GBR', 'JPN', 'KOR', 'MAR', 'SEN', 'CIV', 'CMR',
    'COL', 'URY', 'CHL', 'SRB',
]

const FIELD_STAT_KEYS = [
    'pace', 'stamina', 'strength', 'agility',
    'passing', 'shooting', 'dribbling', 'crossing', 'heading',
    'vision', 'composure', 'workRate', 'positioning',
    'tackling', 'marking',
    'penalties', 'freeKick',
] as const

const GK_STAT_KEYS = [
    'reflexes', 'diving', 'handling', 'positioning',
    'kicking', 'communication',
    'penalties', 'freeKick',
] as const

function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value))
}

function pickRandom<T>(arr: readonly T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]
}

function generateAge(): number {
    // Gaussian-ish centered on 24, range 18-33
    const u1 = Math.random()
    const u2 = Math.random()
    const normal = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
    return clamp(Math.round(24 + normal * 3.5), 18, 33)
}

function generateFieldStats(position: PlayerPosition, targetOverall: number): Record<string, number> {
    const weights = POSITION_WEIGHTS[position]
    const stats: Record<string, number> = {}

    // Generate stats: weighted stats closer to target, unweighted ones lower
    for (const key of FIELD_STAT_KEYS) {
        const weight = weights[key] ?? 0
        if (weight > 0) {
            // Important stat for this position: close to target with noise
            const noise = randomInt(-8, 8)
            stats[key] = clamp(Math.round(targetOverall + noise), 20, 85)
        } else {
            // Unweighted stat: lower range
            stats[key] = clamp(Math.round(targetOverall - randomInt(10, 25)), 15, 70)
        }
    }

    // Adjust weighted stats so the weighted average hits the target
    const weightedKeys = Object.keys(weights)
    let weightedSum = 0
    let totalWeight = 0
    for (const key of weightedKeys) {
        weightedSum += (stats[key] ?? 0) * (weights[key] ?? 0)
        totalWeight += weights[key] ?? 0
    }
    const currentOverall = totalWeight > 0 ? weightedSum / totalWeight : targetOverall
    const diff = targetOverall - currentOverall

    // Distribute the difference across weighted stats
    if (Math.abs(diff) > 0.5) {
        for (const key of weightedKeys) {
            stats[key] = clamp(Math.round((stats[key] ?? 0) + diff), 20, 85)
        }
    }

    // Round to 1 decimal
    for (const key of FIELD_STAT_KEYS) {
        stats[key] = Math.round((stats[key] ?? 40) * 10) / 10
    }

    return stats
}

function generateGKStats(targetOverall: number): Record<string, number> {
    const weights = POSITION_WEIGHTS.GK
    const stats: Record<string, number> = {}

    for (const key of GK_STAT_KEYS) {
        const weight = weights[key] ?? 0
        if (weight > 0) {
            const noise = randomInt(-8, 8)
            stats[key] = clamp(Math.round(targetOverall + noise), 20, 85)
        } else {
            stats[key] = clamp(Math.round(targetOverall - randomInt(5, 15)), 15, 70)
        }
    }

    // Adjust to hit target
    const weightedKeys = Object.keys(weights)
    let weightedSum = 0
    let totalWeight = 0
    for (const key of weightedKeys) {
        weightedSum += (stats[key] ?? 0) * (weights[key] ?? 0)
        totalWeight += weights[key] ?? 0
    }
    const currentOverall = totalWeight > 0 ? weightedSum / totalWeight : targetOverall
    const diff = targetOverall - currentOverall

    if (Math.abs(diff) > 0.5) {
        for (const key of weightedKeys) {
            stats[key] = clamp(Math.round((stats[key] ?? 0) + diff), 20, 85)
        }
    }

    for (const key of GK_STAT_KEYS) {
        stats[key] = Math.round((stats[key] ?? 40) * 10) / 10
    }

    return stats
}

export class SquadGenerationService {
    static async generate(
        clubId: string,
        overallMin: number = SQUAD_INITIAL_OVERALL_MIN,
        overallMax: number = SQUAD_INITIAL_OVERALL_MAX,
    ): Promise<number> {
        const distribution = INITIAL_SQUAD_DISTRIBUTION.slice(0, SQUAD_INITIAL_SIZE)

        for (const position of distribution) {
            const overall = randomInt(overallMin, overallMax)
            const potential = clamp(overall + randomInt(5, 15), overall, 95)
            const salary = overall * SALARY_BASE_PER_OVERALL + randomInt(0, SALARY_RANDOM_BONUS_MAX)
            const releaseClause = salary * 50

            const [player] = await db
                .insert(players)
                .values({
                    clubId,
                    firstName: pickRandom(FIRST_NAMES),
                    lastName: pickRandom(LAST_NAMES),
                    nationality: pickRandom(NATIONALITIES),
                    age: generateAge(),
                    position,
                    secondaryPositions: [],
                    overall,
                    potential,
                    fatigue: randomInt(0, 15),
                    contractMatchesRemaining: SQUAD_INITIAL_CONTRACT_MATCHES,
                    weeklySalary: salary,
                    releaseClause,
                })
                .returning()

            if (position === 'GK') {
                const gkStats = generateGKStats(overall)
                await db.insert(goalkeeperStats).values({
                    playerId: player.id,
                    reflexes: gkStats.reflexes,
                    diving: gkStats.diving,
                    handling: gkStats.handling,
                    positioning: gkStats.positioning,
                    kicking: gkStats.kicking,
                    communication: gkStats.communication,
                    penalties: gkStats.penalties,
                    freeKick: gkStats.freeKick,
                })

                // GKs also get basic field stats (lower)
                const fieldStats = generateFieldStats(position, Math.max(overall - 20, 25))
                await db.insert(playerStats).values({
                    playerId: player.id,
                    pace: fieldStats.pace,
                    stamina: fieldStats.stamina,
                    strength: fieldStats.strength,
                    agility: fieldStats.agility,
                    passing: fieldStats.passing,
                    shooting: fieldStats.shooting,
                    dribbling: fieldStats.dribbling,
                    crossing: fieldStats.crossing,
                    heading: fieldStats.heading,
                    vision: fieldStats.vision,
                    composure: fieldStats.composure,
                    workRate: fieldStats.workRate,
                    positioning: fieldStats.positioning,
                    tackling: fieldStats.tackling,
                    marking: fieldStats.marking,
                    penalties: fieldStats.penalties,
                    freeKick: fieldStats.freeKick,
                })
            } else {
                const fieldStats = generateFieldStats(position, overall)
                await db.insert(playerStats).values({
                    playerId: player.id,
                    pace: fieldStats.pace,
                    stamina: fieldStats.stamina,
                    strength: fieldStats.strength,
                    agility: fieldStats.agility,
                    passing: fieldStats.passing,
                    shooting: fieldStats.shooting,
                    dribbling: fieldStats.dribbling,
                    crossing: fieldStats.crossing,
                    heading: fieldStats.heading,
                    vision: fieldStats.vision,
                    composure: fieldStats.composure,
                    workRate: fieldStats.workRate,
                    positioning: fieldStats.positioning,
                    tackling: fieldStats.tackling,
                    marking: fieldStats.marking,
                    penalties: fieldStats.penalties,
                    freeKick: fieldStats.freeKick,
                })
            }
        }

        return SQUAD_INITIAL_SIZE
    }
}
