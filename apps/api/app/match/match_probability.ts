import type { Mentality } from '@regista/shared'

const MENTALITY_ATTACK_MODIFIER: Record<Mentality, number> = {
    ultra_defensive: 0.6,
    defensive: 0.8,
    balanced: 1.0,
    offensive: 1.2,
    ultra_offensive: 1.4,
}

const PRESSING_FATIGUE: Record<string, number> = {
    low: 0.6,
    medium: 0.8,
    high: 1.2,
}

const TEMPO_FATIGUE: Record<string, number> = {
    slow: 0.7,
    normal: 1.0,
    fast: 1.3,
}

export function possessionChance(
    homeMidfieldStrength: number,
    awayMidfieldStrength: number,
    homeMentality: Mentality,
    awayMentality: Mentality,
): number {
    const homeScore = homeMidfieldStrength * MENTALITY_ATTACK_MODIFIER[homeMentality]
    const awayScore = awayMidfieldStrength * MENTALITY_ATTACK_MODIFIER[awayMentality]
    const total = homeScore + awayScore
    if (total === 0) return 0.5
    return homeScore / total
}

export function shotChance(
    attackStrength: number,
    defenseStrength: number,
    mentality: Mentality,
): number {
    const base = 0.12
    const attackMod = attackStrength / 70 // normalized around 70
    const defenseMod = defenseStrength / 70
    const mentalityMod = MENTALITY_ATTACK_MODIFIER[mentality]
    return Math.min(base * attackMod * mentalityMod / defenseMod, 0.35)
}

export function shotOnTargetChance(shootingStat: number): number {
    // ~35% base, modified by shooting
    return Math.min(0.20 + (shootingStat / 100) * 0.30, 0.65)
}

export function goalChance(
    shootingStat: number,
    composureStat: number,
    gkOverall: number,
): number {
    const attackScore = (shootingStat * 0.7 + composureStat * 0.3) / 100
    const gkScore = gkOverall / 100
    return Math.min(Math.max(attackScore * 0.4 - gkScore * 0.15 + 0.10, 0.05), 0.45)
}

export function foulChance(pressing: string): number {
    const base = 0.04
    const pressingMod: Record<string, number> = { low: 0.5, medium: 1.0, high: 1.5 }
    return base * (pressingMod[pressing] ?? 1.0)
}

export function yellowCardChance(): number {
    return 0.30 // 30% of fouls result in a yellow
}

export function injuryChance(fatigue: number): number {
    // ~0.5% base, rises with fatigue
    return 0.005 * (1 + fatigue / 100)
}

export function fatiguePerMinute(pressing: string, tempo: string): number {
    return 0.8 + 0.2 * (PRESSING_FATIGUE[pressing] ?? 1.0) + 0.2 * (TEMPO_FATIGUE[tempo] ?? 1.0)
}

export function addedTimeMinutes(
    goalsInHalf: number,
    cardsInHalf: number,
    subsInHalf: number,
    injuriesInHalf: number,
): number {
    const time = 1
        + goalsInHalf * 0.5
        + cardsInHalf * 0.5
        + subsInHalf * 0.3
        + injuriesInHalf * 1.0
        + (Math.random() - 0.25)
    return Math.max(1, Math.min(5, Math.round(time)))
}
