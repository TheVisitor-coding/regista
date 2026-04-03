import type { HttpContext } from '@adonisjs/core/http'
import { db } from '@regista/db'
import { clubs } from '@regista/db'
import { eq } from 'drizzle-orm'
import vine from '@vinejs/vine'
import { redis } from '#services/redis'

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

export default class TacticsController {
    async show({ auth, response }: HttpContext) {
        const clubId = await getClubId(auth.userId)
        if (!clubId) return response.notFound({ error: 'CLUB_NOT_FOUND' })

        // Check Redis cache first
        const cached = await redis.get(`tactics:${clubId}`)
        if (cached) {
            return response.ok(JSON.parse(cached))
        }

        return response.ok(DEFAULT_TACTICS)
    }

    async update({ auth, request, response }: HttpContext) {
        const clubId = await getClubId(auth.userId)
        if (!clubId) return response.notFound({ error: 'CLUB_NOT_FOUND' })

        const data = await updateTacticsValidator.validate(request.all())

        // Read current and merge
        const cachedStr = await redis.get(`tactics:${clubId}`)
        const current = cachedStr ? JSON.parse(cachedStr) : { ...DEFAULT_TACTICS }
        const merged = { ...current, ...data }

        // Save to Redis
        await redis.set(`tactics:${clubId}`, JSON.stringify(merged))

        return response.ok(merged)
    }
}
