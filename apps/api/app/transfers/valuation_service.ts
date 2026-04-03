import type { PlayerPosition } from '@regista/shared'

export class ValuationService {
    static calculateMarketValue(
        overall: number,
        age: number,
        potential: number,
        position: PlayerPosition,
        contractMatchesRemaining: number,
    ): number {
        const baseValue = Math.pow((overall - 40) / 10, 2.5) * 100_000

        // Age modifier
        let ageMod: number
        if (age <= 21) ageMod = 1.5
        else if (age <= 24) ageMod = 1.3
        else if (age <= 29) ageMod = 1.0
        else if (age <= 31) ageMod = 0.7
        else if (age <= 33) ageMod = 0.5
        else ageMod = 0.3

        // Potential modifier
        const gap = potential - overall
        let potentialMod: number
        if (gap >= 15) potentialMod = 1.4
        else if (gap >= 10) potentialMod = 1.2
        else if (gap >= 5) potentialMod = 1.1
        else potentialMod = 1.0

        // Position modifier
        let positionMod: number
        if (position === 'ST' || position === 'CF') positionMod = 1.15
        else if (position === 'GK') positionMod = 0.85
        else positionMod = 1.0

        // Contract modifier
        let contractMod: number
        if (contractMatchesRemaining <= 3) contractMod = 0.3
        else if (contractMatchesRemaining <= 10) contractMod = 0.6
        else if (contractMatchesRemaining <= 15) contractMod = 0.8
        else contractMod = 1.0

        const value = baseValue * ageMod * potentialMod * positionMod * contractMod
        return Math.round(value / 10_000) * 10_000 // Round to nearest 10,000

    }

    static calculateAiPrice(overall: number, age: number, potential: number, position: PlayerPosition): number {
        const value = ValuationService.calculateMarketValue(overall, age, potential, position, 20)
        // ±15% random variation
        const variation = 1 + (Math.random() * 0.3 - 0.15)
        return Math.round(value * variation / 10_000) * 10_000
    }
}
