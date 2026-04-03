import type { HttpContext } from '@adonisjs/core/http'
import { db } from '@regista/db'
import { clubs, notifications } from '@regista/db'
import { and, count, desc, eq, lt } from 'drizzle-orm'
import { listNotificationsValidator } from './notification_validator.js'

async function getClubId(userId: string): Promise<string | null> {
    const [club] = await db
        .select({ id: clubs.id })
        .from(clubs)
        .where(eq(clubs.userId, userId))
        .limit(1)
    return club?.id ?? null
}

export default class NotificationController {
    async index({ auth, request, response }: HttpContext) {
        const clubId = await getClubId(auth.userId)
        if (!clubId) {
            return response.notFound({ error: 'CLUB_NOT_FOUND', message: 'You do not have a club' })
        }

        const params = await listNotificationsValidator.validate(request.qs())
        const limit = params.limit ?? 20

        const conditions = [eq(notifications.clubId, clubId)]

        if (params.category) {
            conditions.push(eq(notifications.category, params.category as any))
        }
        if (params.staffRole) {
            conditions.push(eq(notifications.staffRole, params.staffRole as any))
        }
        if (params.isRead !== undefined) {
            conditions.push(eq(notifications.isRead, params.isRead === 'true'))
        }
        if (params.cursor) {
            const [cursorNotif] = await db
                .select({ createdAt: notifications.createdAt })
                .from(notifications)
                .where(eq(notifications.id, params.cursor))
                .limit(1)
            if (cursorNotif) {
                conditions.push(lt(notifications.createdAt, cursorNotif.createdAt))
            }
        }

        const items = await db
            .select()
            .from(notifications)
            .where(and(...conditions))
            .orderBy(desc(notifications.isPinned), desc(notifications.createdAt))
            .limit(limit + 1)

        const hasMore = items.length > limit
        const results = hasMore ? items.slice(0, limit) : items

        const [totalResult] = await db
            .select({ value: count(notifications.id) })
            .from(notifications)
            .where(eq(notifications.clubId, clubId))

        return response.ok({
            notifications: results.map(formatNotification),
            nextCursor: hasMore ? results[results.length - 1].id : null,
            total: totalResult?.value ?? 0,
        })
    }

    async markRead({ auth, params, response }: HttpContext) {
        const clubId = await getClubId(auth.userId)
        if (!clubId) {
            return response.notFound({ error: 'CLUB_NOT_FOUND' })
        }

        const [updated] = await db
            .update(notifications)
            .set({ isRead: true })
            .where(and(eq(notifications.id, params.id), eq(notifications.clubId, clubId)))
            .returning()

        if (!updated) {
            return response.notFound({ error: 'NOTIFICATION_NOT_FOUND' })
        }

        return response.ok({ notification: formatNotification(updated) })
    }

    async markAllRead({ auth, response }: HttpContext) {
        const clubId = await getClubId(auth.userId)
        if (!clubId) {
            return response.notFound({ error: 'CLUB_NOT_FOUND' })
        }

        await db
            .update(notifications)
            .set({ isRead: true })
            .where(and(eq(notifications.clubId, clubId), eq(notifications.isRead, false)))

        return response.ok({ success: true })
    }

    async unreadCount({ auth, response }: HttpContext) {
        const clubId = await getClubId(auth.userId)
        if (!clubId) {
            return response.notFound({ error: 'CLUB_NOT_FOUND' })
        }

        const [result] = await db
            .select({ value: count(notifications.id) })
            .from(notifications)
            .where(and(eq(notifications.clubId, clubId), eq(notifications.isRead, false)))

        return response.ok({ count: result?.value ?? 0 })
    }
}

function formatNotification(n: typeof notifications.$inferSelect) {
    return {
        id: n.id,
        clubId: n.clubId,
        staffRole: n.staffRole,
        category: n.category,
        priority: n.priority,
        title: n.title,
        message: n.message,
        actionUrl: n.actionUrl,
        isRead: n.isRead,
        isPinned: n.isPinned,
        metadata: n.metadata,
        createdAt: n.createdAt.toISOString(),
    }
}
