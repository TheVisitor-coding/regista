import vine from '@vinejs/vine'

export const listTransactionsValidator = vine.compile(
    vine.object({
        cursor: vine.string().uuid().optional(),
        limit: vine.number().min(1).max(50).optional(),
        type: vine.string().optional(),
    }),
)
