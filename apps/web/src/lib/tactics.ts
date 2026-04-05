import { apiClient } from '~/lib/api-client'
import type { TacticConfig } from '@regista/shared'

export async function fetchTactics(): Promise<TacticConfig> {
  return apiClient<TacticConfig>('/tactics')
}

export async function updateTactics(data: Partial<TacticConfig>): Promise<TacticConfig> {
  return apiClient('/tactics', { method: 'PUT', body: JSON.stringify(data) })
}

// Presets
export interface TacticalPreset {
  id: string
  clubId: string
  name: string
  formation: string
  mentality: string
  pressing: string
  passingStyle: string
  width: string
  tempo: string
  defensiveLine: string
  isDefault: boolean
}

export async function fetchPresets(): Promise<{ presets: TacticalPreset[] }> {
  return apiClient('/tactics/presets')
}

export async function createPreset(data: Omit<TacticalPreset, 'id' | 'clubId' | 'isDefault'>): Promise<{ preset: TacticalPreset }> {
  return apiClient('/tactics/presets', { method: 'POST', body: JSON.stringify(data) })
}

export async function deletePreset(id: string): Promise<void> {
  await apiClient(`/tactics/presets/${id}`, { method: 'DELETE' })
}

export async function applyPreset(id: string): Promise<{ tactics: TacticConfig; startingXI: LineupSlot[]; bench: LineupSlot[] }> {
  return apiClient(`/tactics/presets/${id}/apply`, { method: 'POST' })
}

// Auto-lineup
export interface LineupSlot {
  playerId: string
  position: string
  playerName: string
  naturalPosition: string
  overall: number
  fatigue: number
  compatibility?: number
}

export interface AutoLineupResponse {
  startingXI: LineupSlot[]
  bench: LineupSlot[]
  coherence: number
  warnings: string[]
}

export async function fetchAutoLineup(formation: string): Promise<AutoLineupResponse> {
  return apiClient(`/tactics/auto-lineup?formation=${encodeURIComponent(formation)}`, { method: 'POST' })
}

// Composition
export async function fetchComposition(): Promise<{ formation: string; startingXI: LineupSlot[]; bench: LineupSlot[]; coherence: number; warnings: string[] }> {
  return apiClient('/tactics/composition')
}

export async function saveComposition(data: {
  formation: string
  startingXI: Array<{ playerId: string; position: string }>
  bench: Array<{ playerId: string; position: string }>
  captainId?: string
}): Promise<{ coherence: number; warnings: string[] }> {
  return apiClient('/tactics/composition', { method: 'PUT', body: JSON.stringify(data) })
}

// Auto-adjustment
export async function toggleAutoAdjustment(enabled: boolean): Promise<void> {
  await apiClient('/tactics/auto-adjustment', { method: 'PATCH', body: JSON.stringify({ enabled }) })
}

// Pre-match analysis
export interface PreMatchAnalysis {
  opponent: {
    id: string
    name: string
    primaryColor: string
    recentForm: string[]
    recentGoalsScored: number
    recentGoalsConceded: number
    lineOveralls: { defense: number; midfield: number; attack: number }
  }
  suggestion: {
    text: string
    staffRole: string
    suggestedPreset: string
  }
}

export async function fetchAnalysis(matchId: string): Promise<PreMatchAnalysis> {
  return apiClient(`/tactics/analysis/${matchId}`)
}
