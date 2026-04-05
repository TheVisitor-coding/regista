import type { HttpContext } from '@adonisjs/core/http'
import { db } from '@regista/db'
import { clubs, clubStaff, divisions, users, staffRoleEnum } from '@regista/db'
import { INITIAL_CLUB_BUDGET_CENTS } from '@regista/shared'
import { eq, sql } from 'drizzle-orm'
import { createClubValidator, updateClubValidator } from './club_validator.js'
import { SquadGenerationService } from './squad_generation_service.js'
import { NotificationService } from '../notifications/notification_service.js'
import { LeagueService } from '../competition/league_service.js'
import { OnboardingService } from '../onboarding/onboarding_service.js'
import { TacticalPresetsService } from '../tactics/presets_service.js'

type StaffRole = (typeof staffRoleEnum.enumValues)[number]

const STAFF_NAME_POOL = {
    firstNames: ['Julien', 'Maya', 'Sofia', 'Nolan', 'Hugo', 'Clara', 'Samir', 'Iris'],
    lastNames: ['Durand', 'Martin', 'Lopez', 'Petit', 'Rossi', 'Belaid', 'Moreau', 'Keller'],
} as const

const DEFAULT_STAFF_ROLES: StaffRole[] = [
    'assistant',
    'doctor',
    'sporting_director',
    'secretary',
]

function pickName(seed: number) {
    const firstName = STAFF_NAME_POOL.firstNames[seed % STAFF_NAME_POOL.firstNames.length]
    const lastName = STAFF_NAME_POOL.lastNames[(seed * 3) % STAFF_NAME_POOL.lastNames.length]
    return { firstName, lastName }
}

function formatClub(club: typeof clubs.$inferSelect) {
    return {
        id: club.id,
        userId: club.userId,
        name: club.name,
        primaryColor: club.primaryColor,
        secondaryColor: club.secondaryColor,
        logoId: club.logoId,
        stadiumName: club.stadiumName,
        balance: club.balance,
        morale: club.morale,
        leagueId: club.leagueId,
        divisionId: club.divisionId,
        isAi: club.isAi,
        aiProfile: club.aiProfile,
        nameChangesRemaining: club.nameChangesRemaining,
        createdAt: club.createdAt.toISOString(),
        updatedAt: club.updatedAt.toISOString(),
    }
}

async function findClubByUserId(userId: string) {
    const [club] = await db
        .select()
        .from(clubs)
        .where(eq(clubs.userId, userId))
        .limit(1)

    return club ?? null
}

async function isClubNameTaken(name: string) {
    const [existing] = await db
        .select({ id: clubs.id })
        .from(clubs)
        .where(sql`lower(${clubs.name}) = lower(${name})`)
        .limit(1)

    return !!existing
}

export default class ClubController {
    async create({ auth, request, response }: HttpContext) {
        const data = await createClubValidator.validate(request.all())

        const [user] = await db
            .select({ id: users.id, status: users.status })
            .from(users)
            .where(eq(users.id, auth.userId))
            .limit(1)

        if (!user) {
            return response.notFound({ error: 'USER_NOT_FOUND', message: 'User not found' })
        }

        if (user.status !== 'active') {
            return response.forbidden({
                error: 'ACCOUNT_NOT_ACTIVE',
                message: 'Only active accounts can create a club',
            })
        }

        const existingClub = await findClubByUserId(auth.userId)
        if (existingClub) {
            return response.conflict({
                error: 'CLUB_ALREADY_EXISTS',
                message: 'You already have a club',
            })
        }

        if (await isClubNameTaken(data.name)) {
            return response.conflict({
                error: 'CLUB_NAME_TAKEN',
                errors: [{ field: 'name', message: 'Club name is already taken', rule: 'unique' }],
            })
        }

        const stadiumName = data.stadiumName ?? `${data.name} Arena`

        const [club] = await db
            .insert(clubs)
            .values({
                userId: auth.userId,
                name: data.name,
                primaryColor: data.primaryColor,
                secondaryColor: data.secondaryColor,
                logoId: data.logoId,
                stadiumName,
                balance: INITIAL_CLUB_BUDGET_CENTS,
                morale: 60,
            })
            .returning()

        await db.insert(clubStaff).values(
            DEFAULT_STAFF_ROLES.map((role, index) => {
                const { firstName, lastName } = pickName(index + 1)
                return {
                    clubId: club.id,
                    role,
                    firstName,
                    lastName,
                    avatarId: `${role}-default-${index + 1}`,
                }
            }),
        )

        const squadSize = await SquadGenerationService.generate(club.id)
        await NotificationService.createWelcomeNotifications(club.id)

        // Create league with AI clubs and calendar
        await LeagueService.createLeague(club.id)

        // Initialize onboarding missions + default tactical presets
        await OnboardingService.initializeMissions(auth.userId)
        await TacticalPresetsService.createDefaultPresets(club.id)

        // Refetch club with league/division info
        const [updatedClub] = await db
            .select()
            .from(clubs)
            .where(eq(clubs.id, club.id))
            .limit(1)

        return response.created({ club: formatClub(updatedClub ?? club), squadSize })
    }

    async mine({ auth, response }: HttpContext) {
        const club = await findClubByUserId(auth.userId)

        if (!club) {
            return response.notFound({
                error: 'CLUB_NOT_FOUND',
                message: 'You do not have a club yet',
            })
        }

        let divisionName: string | null = null
        if (club.divisionId) {
            const [div] = await db
                .select({ name: divisions.name })
                .from(divisions)
                .where(eq(divisions.id, club.divisionId))
                .limit(1)
            divisionName = div?.name ?? null
        }

        return response.ok({ club: formatClub(club), divisionName })
    }

    async updateMine({ auth, request, response }: HttpContext) {
        const data = await updateClubValidator.validate(request.all())

        const club = await findClubByUserId(auth.userId)
        if (!club) {
            return response.notFound({
                error: 'CLUB_NOT_FOUND',
                message: 'You do not have a club yet',
            })
        }

        const updates: Partial<typeof clubs.$inferInsert> = {
            updatedAt: new Date(),
        }

        if (data.name && data.name.toLowerCase() !== club.name.toLowerCase()) {
            if (club.nameChangesRemaining <= 0) {
                return response.forbidden({
                    error: 'NO_NAME_CHANGES_REMAINING',
                    message: 'No club name changes remaining this season',
                })
            }

            if (await isClubNameTaken(data.name)) {
                return response.conflict({
                    error: 'CLUB_NAME_TAKEN',
                    errors: [{ field: 'name', message: 'Club name is already taken', rule: 'unique' }],
                })
            }

            updates.name = data.name
            updates.nameChangesRemaining = club.nameChangesRemaining - 1
        }

        if (data.primaryColor) updates.primaryColor = data.primaryColor
        if (data.secondaryColor) updates.secondaryColor = data.secondaryColor
        if (data.stadiumName) updates.stadiumName = data.stadiumName

        const [updated] = await db
            .update(clubs)
            .set(updates)
            .where(eq(clubs.id, club.id))
            .returning()

        return response.ok({ club: formatClub(updated) })
    }

    async checkName({ request, response }: HttpContext) {
        const name = request.input('name', '')

        if (!name || name.length < 2 || name.length > 30) {
            return response.ok({ available: false, reason: 'Name must be between 2 and 30 characters' })
        }

        const taken = await isClubNameTaken(name)
        return response.ok({ available: !taken, reason: taken ? 'Club name is already taken' : undefined })
    }

    async show({ params, response }: HttpContext) {
        const [club] = await db
            .select()
            .from(clubs)
            .where(eq(clubs.id, params.id))
            .limit(1)

        if (!club) {
            return response.notFound({
                error: 'CLUB_NOT_FOUND',
                message: 'Club not found',
            })
        }

        return response.ok({ club: formatClub(club) })
    }
}
