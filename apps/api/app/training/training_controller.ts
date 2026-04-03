import type { HttpContext } from '@adonisjs/core/http'
import { db } from '@regista/db'
import { clubs, trainingPrograms } from '@regista/db'
import { eq } from 'drizzle-orm'
import vine from '@vinejs/vine'

const updateTrainingValidator = vine.compile(
    vine.object({
        gkFocus: vine.string().in(['reflexes', 'distribution', 'placement', 'rest']).optional(),
        defFocus: vine.string().in(['physical', 'technical', 'mental', 'defensive', 'set_pieces', 'rest']).optional(),
        midFocus: vine.string().in(['physical', 'technical', 'mental', 'defensive', 'set_pieces', 'rest']).optional(),
        attFocus: vine.string().in(['physical', 'technical', 'mental', 'defensive', 'set_pieces', 'rest']).optional(),
        individualOverrides: vine.object({}).allowUnknownProperties().optional(),
    }),
)

async function getClubId(userId: string): Promise<string | null> {
    const [club] = await db.select({ id: clubs.id }).from(clubs).where(eq(clubs.userId, userId)).limit(1)
    return club?.id ?? null
}

export default class TrainingController {
    async show({ auth, response }: HttpContext) {
        const clubId = await getClubId(auth.userId)
        if (!clubId) return response.notFound({ error: 'CLUB_NOT_FOUND' })

        const [program] = await db
            .select()
            .from(trainingPrograms)
            .where(eq(trainingPrograms.clubId, clubId))
            .limit(1)

        return response.ok(program ?? {
            gkFocus: 'reflexes',
            defFocus: 'defensive',
            midFocus: 'technical',
            attFocus: 'technical',
            individualOverrides: {},
        })
    }

    async update({ auth, request, response }: HttpContext) {
        const clubId = await getClubId(auth.userId)
        if (!clubId) return response.notFound({ error: 'CLUB_NOT_FOUND' })

        const data = await updateTrainingValidator.validate(request.all())

        const [existing] = await db
            .select({ id: trainingPrograms.id })
            .from(trainingPrograms)
            .where(eq(trainingPrograms.clubId, clubId))
            .limit(1)

        if (existing) {
            await db.update(trainingPrograms)
                .set({ ...data, updatedAt: new Date() } as any)
                .where(eq(trainingPrograms.clubId, clubId))
        } else {
            await db.insert(trainingPrograms).values({
                clubId,
                gkFocus: data.gkFocus ?? 'reflexes',
                defFocus: data.defFocus ?? 'defensive',
                midFocus: data.midFocus ?? 'technical',
                attFocus: data.attFocus ?? 'technical',
                individualOverrides: (data.individualOverrides ?? {}) as Record<string, string>,
            })
        }

        return response.ok({ success: true })
    }
}
