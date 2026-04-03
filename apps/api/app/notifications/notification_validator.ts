import vine from '@vinejs/vine'

export const listNotificationsValidator = vine.compile(
    vine.object({
        cursor: vine.string().uuid().optional(),
        limit: vine.number().min(1).max(50).optional(),
        category: vine.string().optional(),
        staffRole: vine.string().optional(),
        isRead: vine.string().in(['true', 'false']).optional(),
    }),
)
