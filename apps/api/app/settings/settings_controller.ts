import type { HttpContext } from '@adonisjs/core/http'
import { db } from '@regista/db'
import { notificationPreferences } from '@regista/db'
import { eq } from 'drizzle-orm'
import { updateNotificationPreferencesValidator } from './settings_validator.js'

const DEFAULTS = {
    matchReminders: true,
    matchResults: true,
    standingChanges: true,
    squadAlerts: true,
    financeAlerts: true,
    transferAlerts: true,
}

export default class SettingsController {
    async getNotificationPreferences({ auth, response }: HttpContext) {
        const [prefs] = await db
            .select()
            .from(notificationPreferences)
            .where(eq(notificationPreferences.userId, auth.userId))
            .limit(1)

        return response.ok(prefs ? {
            matchReminders: prefs.matchReminders,
            matchResults: prefs.matchResults,
            standingChanges: prefs.standingChanges,
            squadAlerts: prefs.squadAlerts,
            financeAlerts: prefs.financeAlerts,
            transferAlerts: prefs.transferAlerts,
        } : DEFAULTS)
    }

    async updateNotificationPreferences({ auth, request, response }: HttpContext) {
        const data = await updateNotificationPreferencesValidator.validate(request.all())

        const [existing] = await db
            .select({ id: notificationPreferences.id })
            .from(notificationPreferences)
            .where(eq(notificationPreferences.userId, auth.userId))
            .limit(1)

        if (existing) {
            await db
                .update(notificationPreferences)
                .set({ ...data, updatedAt: new Date() })
                .where(eq(notificationPreferences.userId, auth.userId))
        } else {
            await db
                .insert(notificationPreferences)
                .values({
                    userId: auth.userId,
                    ...DEFAULTS,
                    ...data,
                })
        }

        return response.ok({ success: true })
    }
}
