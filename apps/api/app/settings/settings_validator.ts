import vine from '@vinejs/vine'

export const updateNotificationPreferencesValidator = vine.compile(
    vine.object({
        matchReminders: vine.boolean().optional(),
        matchResults: vine.boolean().optional(),
        standingChanges: vine.boolean().optional(),
        squadAlerts: vine.boolean().optional(),
        financeAlerts: vine.boolean().optional(),
        transferAlerts: vine.boolean().optional(),
    }),
)
