import vine from '@vinejs/vine'

export const listSquadValidator = vine.compile(
    vine.object({
        sortBy: vine.string().in(['overall', 'fatigue', 'age', 'salary', 'name', 'position']).optional(),
        sortOrder: vine.string().in(['asc', 'desc']).optional(),
        line: vine.string().in(['GK', 'DEF', 'MID', 'ATT']).optional(),
    }),
)
