import type { HttpContext } from '@adonisjs/core/http'
import { db } from '@regista/db'
import { moderationReports } from '@regista/db'
import { and, count, eq, gte } from 'drizzle-orm'
import vine from '@vinejs/vine'
import { NameValidationService } from './name_validation_service.js'

const validateNameValidator = vine.compile(
    vine.object({
        name: vine.string().trim().minLength(2).maxLength(30),
    }),
)

const createReportValidator = vine.compile(
    vine.object({
        targetClubId: vine.string().uuid().optional(),
        targetUserId: vine.string().uuid().optional(),
        reason: vine.string().in(['offensive_name', 'cheating', 'toxic_behavior', 'other']),
        description: vine.string().maxLength(500).optional(),
    }),
)

export default class ModerationController {
    /**
     * POST /names/validate — Check if a name is allowed.
     */
    async validateName({ request, response }: HttpContext) {
        const data = await validateNameValidator.validate(request.all())
        const rejection = await NameValidationService.validateName(data.name)

        if (rejection) {
            return response.ok({ valid: false, reason: rejection })
        }

        return response.ok({ valid: true })
    }

    /**
     * POST /reports — Submit a report.
     */
    async createReport({ auth, request, response }: HttpContext) {
        const data = await createReportValidator.validate(request.all())

        if (!data.targetClubId && !data.targetUserId) {
            return response.badRequest({ error: 'Must specify targetClubId or targetUserId' })
        }

        // Rate limit: 3 reports per 24h
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
        const [recentCount] = await db
            .select({ value: count(moderationReports.id) })
            .from(moderationReports)
            .where(and(
                eq(moderationReports.reporterId, auth.userId),
                gte(moderationReports.createdAt, oneDayAgo),
            ))

        if ((recentCount?.value ?? 0) >= 3) {
            return response.tooManyRequests({ error: 'Maximum 3 reports per 24 hours' })
        }

        const [report] = await db.insert(moderationReports).values({
            reporterId: auth.userId,
            targetUserId: data.targetUserId ?? null,
            targetClubId: data.targetClubId ?? null,
            reason: data.reason as any,
            description: data.description ?? null,
        }).returning()

        return response.created({
            report: {
                id: report.id,
                reason: report.reason,
                status: report.status,
                createdAt: report.createdAt.toISOString(),
            },
        })
    }
}
