import { db } from '@regista/db'
import { nameBlacklist } from '@regista/db'
import { redis } from '#services/redis'

const BLACKLIST_CACHE_KEY = 'moderation:blacklist'
const BLACKLIST_TTL = 3600 // 1 hour

// Leet speak normalization map
const LEET_MAP: Record<string, string> = {
    '@': 'a', '4': 'a',
    '3': 'e',
    '1': 'i', '!': 'i',
    '0': 'o',
    '$': 's', '5': 's',
    '7': 't',
}

function normalizeLeet(input: string): string {
    return input
        .split('')
        .map((ch) => LEET_MAP[ch] ?? ch)
        .join('')
        .toLowerCase()
}

export class NameValidationService {
    /**
     * Load blacklist terms from DB into Redis cache.
     */
    static async refreshCache(): Promise<number> {
        const terms = await db.select({ term: nameBlacklist.term }).from(nameBlacklist)
        const termList = terms.map((t) => t.term.toLowerCase())

        if (termList.length > 0) {
            await redis.set(BLACKLIST_CACHE_KEY, JSON.stringify(termList), 'EX', BLACKLIST_TTL)
        }

        return termList.length
    }

    /**
     * Get cached blacklist terms.
     */
    static async getBlacklistTerms(): Promise<string[]> {
        const cached = await redis.get(BLACKLIST_CACHE_KEY)
        if (cached) {
            return JSON.parse(cached) as string[]
        }

        // Cache miss — load from DB
        await NameValidationService.refreshCache()
        const fresh = await redis.get(BLACKLIST_CACHE_KEY)
        return fresh ? JSON.parse(fresh) : []
    }

    /**
     * Validate a name against the blacklist.
     * Returns null if valid, or a reason string if invalid.
     */
    static async validateName(name: string): Promise<string | null> {
        const normalized = normalizeLeet(name)
        const terms = await NameValidationService.getBlacklistTerms()

        for (const term of terms) {
            if (normalized.includes(term)) {
                return 'This name contains inappropriate content'
            }
        }

        return null
    }
}
