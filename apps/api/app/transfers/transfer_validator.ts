import vine from '@vinejs/vine'

export const sellPlayerValidator = vine.compile(
    vine.object({
        playerId: vine.string().uuid(),
        price: vine.number().min(10_000),
    }),
)

export const makeOfferValidator = vine.compile(
    vine.object({
        playerId: vine.string().uuid(),
        amount: vine.number().min(10_000),
    }),
)

export const counterOfferValidator = vine.compile(
    vine.object({
        amount: vine.number().min(10_000),
    }),
)

export const marketQueryValidator = vine.compile(
    vine.object({
        page: vine.number().min(1).optional(),
        limit: vine.number().min(1).max(50).optional(),
        position: vine.string().optional(),
        overallMin: vine.number().optional(),
        overallMax: vine.number().optional(),
        ageMin: vine.number().optional(),
        ageMax: vine.number().optional(),
        priceMin: vine.number().optional(),
        priceMax: vine.number().optional(),
        source: vine.string().in(['ai_market', 'human_listing']).optional(),
        sortBy: vine.string().in(['overall', 'price', 'age', 'potential', 'recent']).optional(),
        sortOrder: vine.string().in(['asc', 'desc']).optional(),
    }),
)
