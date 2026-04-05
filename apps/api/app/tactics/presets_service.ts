import { db } from '@regista/db'
import { tacticalPresets } from '@regista/db'

const DEFAULT_PRESETS = [
    {
        name: 'Offensif',
        formation: '4-3-3',
        mentality: 'offensive' as const,
        pressing: 'high' as const,
        passingStyle: 'long' as const,
        width: 'wide' as const,
        tempo: 'fast' as const,
        defensiveLine: 'high' as const,
    },
    {
        name: 'Équilibré',
        formation: '4-4-2',
        mentality: 'balanced' as const,
        pressing: 'medium' as const,
        passingStyle: 'mixed' as const,
        width: 'normal' as const,
        tempo: 'normal' as const,
        defensiveLine: 'medium' as const,
    },
    {
        name: 'Défensif',
        formation: '5-4-1',
        mentality: 'defensive' as const,
        pressing: 'low' as const,
        passingStyle: 'short' as const,
        width: 'narrow' as const,
        tempo: 'slow' as const,
        defensiveLine: 'low' as const,
    },
]

export class TacticalPresetsService {
    static async createDefaultPresets(clubId: string) {
        await db.insert(tacticalPresets).values(
            DEFAULT_PRESETS.map((preset) => ({
                clubId,
                ...preset,
                isDefault: true,
            })),
        )
    }
}
