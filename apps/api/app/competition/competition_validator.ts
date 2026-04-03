import vine from '@vinejs/vine'

export const standingsQueryValidator = vine.compile(
    vine.object({
        view: vine.string().in(['general', 'home', 'away', 'form']).optional(),
    }),
)

export const matchdayParamsValidator = vine.compile(
    vine.object({
        number: vine.number().min(1).max(38),
    }),
)
