import { db } from '@regista/db'
import { clubs, clubStaff } from '@regista/db'
import {
    INITIAL_CLUB_BUDGET_CENTS,
    AI_OVERALL_RANGES,
    COLOR_PRESETS,
    LOGO_PRESETS,
    MORALE_INITIAL,
} from '@regista/shared'
import { SquadGenerationService } from '../clubs/squad_generation_service.js'

const PREFIXES = ['FC', 'AS', 'SC', 'AC', 'RC', 'CF', 'CD', 'SS', 'SV', 'US']
const CITIES = [
    'Bordeaux', 'Valencia', 'Milano', 'Berlin', 'Porto', 'Ajax', 'Lyon', 'Napoli',
    'Sevilla', 'Munich', 'Dublin', 'Lisbon', 'Roma', 'Turin', 'Zurich', 'Vienna',
    'Oslo', 'Prague', 'Warsaw', 'Athens', 'Budapest', 'Sofia', 'Zagreb', 'Bruges',
    'Geneva', 'Basel', 'Genoa', 'Palermo', 'Bologna', 'Bilbao', 'Malaga', 'Granada',
    'Freiburg', 'Leipzig', 'Bremen', 'Koln', 'Lille', 'Rennes', 'Nice', 'Nantes',
    'Montpellier', 'Strasbourg', 'Lens', 'Brest', 'Reims', 'Angers', 'Metz',
    'Troyes', 'Caen', 'Nancy', 'Dijon', 'Amiens', 'Auxerre', 'Lorient', 'Guingamp',
    'Bastia', 'Sochaux', 'Sedan', 'Grenoble',
]
const SUFFIXES = ['United', 'City', 'Athletic', 'Sporting', 'Olympic', 'Royal', 'Inter', 'Dynamo', '']

const STAFF_FIRST = ['Marco', 'Pierre', 'Hans', 'Jorge', 'Klaus', 'Yuri', 'Paolo', 'Andre']
const STAFF_LAST = ['Rossi', 'Schmidt', 'Garcia', 'Silva', 'Muller', 'Petrov', 'Martin', 'Bernard']

const AI_PROFILES = ['offensive', 'balanced', 'defensive'] as const
const AI_PROFILE_WEIGHTS = [0.30, 0.45, 0.25]

const usedNames = new Set<string>()

function pickRandom<T>(arr: readonly T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]
}

function pickWeighted<T>(items: readonly T[], weights: number[]): T {
    const r = Math.random()
    let cumulative = 0
    for (let i = 0; i < items.length; i++) {
        cumulative += weights[i]
        if (r <= cumulative) return items[i]
    }
    return items[items.length - 1]
}

function generateClubName(): string {
    for (let attempt = 0; attempt < 100; attempt++) {
        const prefix = pickRandom(PREFIXES)
        const city = pickRandom(CITIES)
        const suffix = pickRandom(SUFFIXES)
        const name = suffix ? `${prefix} ${city} ${suffix}` : `${prefix} ${city}`
        const trimmed = name.length > 30 ? name.slice(0, 30) : name
        if (!usedNames.has(trimmed.toLowerCase())) {
            usedNames.add(trimmed.toLowerCase())
            return trimmed
        }
    }
    return `AI Club ${Date.now()}`
}

export class AiClubService {
    static async generateClub(
        divisionId: string,
        leagueId: string,
        divisionLevel: number,
    ): Promise<string> {
        const name = generateClubName()
        const primaryColor = pickRandom(COLOR_PRESETS)
        const secondaryColor = pickRandom(COLOR_PRESETS.filter((c) => c !== primaryColor))
        const logoId = pickRandom(LOGO_PRESETS)
        const profile = pickWeighted(AI_PROFILES, AI_PROFILE_WEIGHTS)

        const [club] = await db
            .insert(clubs)
            .values({
                userId: null,
                name,
                primaryColor,
                secondaryColor,
                logoId,
                stadiumName: `${name} Stadium`.slice(0, 50),
                balance: INITIAL_CLUB_BUDGET_CENTS,
                morale: MORALE_INITIAL,
                leagueId,
                divisionId,
                isAi: true,
                aiProfile: profile,
            })
            .returning()

        // Generate staff
        const roles = ['assistant', 'doctor', 'sporting_director', 'secretary'] as const
        await db.insert(clubStaff).values(
            roles.map((role, i) => ({
                clubId: club.id,
                role,
                firstName: STAFF_FIRST[i % STAFF_FIRST.length],
                lastName: STAFF_LAST[i % STAFF_LAST.length],
                avatarId: `${role}-ai-${i + 1}`,
            })),
        )

        // Generate squad calibrated to division
        const [overallMin, overallMax] = AI_OVERALL_RANGES[divisionLevel] ?? [55, 65]
        await SquadGenerationService.generate(club.id, overallMin, overallMax)

        return club.id
    }

    static async generateClubsForDivision(
        divisionId: string,
        leagueId: string,
        divisionLevel: number,
        count: number,
    ): Promise<string[]> {
        const ids: string[] = []
        for (let i = 0; i < count; i++) {
            const id = await AiClubService.generateClub(divisionId, leagueId, divisionLevel)
            ids.push(id)
        }
        return ids
    }
}
