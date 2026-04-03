import vine from '@vinejs/vine'

export const matchListValidator = vine.compile(
    vine.object({
        filter: vine.string().in(['upcoming', 'past', 'all']).optional(),
        page: vine.number().min(1).optional(),
        limit: vine.number().min(1).max(50).optional(),
    }),
)
