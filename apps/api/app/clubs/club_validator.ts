import vine from '@vinejs/vine'

const hexColorRegex = /^#[0-9a-fA-F]{6}$/

export const createClubValidator = vine.compile(
    vine.object({
        name: vine.string().trim().minLength(2).maxLength(30),
        primaryColor: vine.string().trim().regex(hexColorRegex),
        secondaryColor: vine.string().trim().regex(hexColorRegex),
        logoId: vine.string().trim().minLength(1).maxLength(50),
        stadiumName: vine.string().trim().minLength(2).maxLength(50).optional(),
    }),
)

export const updateClubValidator = vine.compile(
    vine.object({
        name: vine.string().trim().minLength(2).maxLength(30).optional(),
        primaryColor: vine.string().trim().regex(hexColorRegex).optional(),
        secondaryColor: vine.string().trim().regex(hexColorRegex).optional(),
        stadiumName: vine.string().trim().minLength(2).maxLength(50).optional(),
    }),
)
