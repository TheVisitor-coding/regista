import type { MatchLiveState, MatchEvent, TacticConfig } from '@regista/shared'

export interface TeamState {
    clubId: string
    isAi: boolean
    aiProfile: string | null
    tactics: TacticConfig
    onPitch: PlayerState[]
    bench: PlayerState[]
    score: number
    substitutionsUsed: number
    yellowCards: number
    redCards: number
    shotsTotal: number
    shotsOnTarget: number
    fouls: number
    corners: number
    saves: number
    possessionMinutes: number
}

export interface PlayerState {
    playerId: string
    position: string
    overall: number
    fatigue: number
    yellowCards: number
    isOut: boolean // sent off or injured out
    // Key stats for simulation
    shooting: number
    passing: number
    vision: number
    tackling: number
    dribbling: number
    composure: number
    workRate: number
    stamina: number
    pace: number
    heading: number
    crossing: number
    marking: number
    // GK stats (only for GK)
    reflexes: number
    diving: number
}

export interface MatchState {
    matchId: string
    status: 'first_half' | 'half_time' | 'second_half' | 'finished'
    minute: number
    home: TeamState
    away: TeamState
    events: MatchEvent[]
    goalsFirstHalf: number
    cardsFirstHalf: number
    subsFirstHalf: number
    injuriesFirstHalf: number
    goalsSecondHalf: number
    cardsSecondHalf: number
    subsSecondHalf: number
    injuriesSecondHalf: number
}

export function midfieldStrength(team: TeamState): number {
    const midfielders = team.onPitch.filter((p) =>
        ['CM', 'CDM', 'CAM', 'LM', 'RM'].includes(p.position) && !p.isOut,
    )
    if (midfielders.length === 0) return 30
    const avg = midfielders.reduce((sum, p) => {
        const fatigueMod = 1 - p.fatigue / 200
        return sum + (p.passing + p.vision + p.workRate) / 3 * fatigueMod
    }, 0) / midfielders.length
    return avg
}

export function attackStrength(team: TeamState): number {
    const attackers = team.onPitch.filter((p) =>
        ['ST', 'CF', 'LW', 'RW', 'CAM'].includes(p.position) && !p.isOut,
    )
    if (attackers.length === 0) return 20
    const avg = attackers.reduce((sum, p) => {
        const fatigueMod = 1 - p.fatigue / 200
        return sum + (p.shooting + p.composure + p.dribbling) / 3 * fatigueMod
    }, 0) / attackers.length
    return avg
}

export function defenseStrength(team: TeamState): number {
    const defenders = team.onPitch.filter((p) =>
        ['CB', 'LB', 'RB', 'CDM'].includes(p.position) && !p.isOut,
    )
    if (defenders.length === 0) return 20
    const avg = defenders.reduce((sum, p) => {
        const fatigueMod = 1 - p.fatigue / 200
        return sum + (p.tackling + p.marking + p.heading) / 3 * fatigueMod
    }, 0) / defenders.length
    return avg
}

export function getGoalkeeper(team: TeamState): PlayerState | undefined {
    return team.onPitch.find((p) => p.position === 'GK' && !p.isOut)
}

export function getRandomAttacker(team: TeamState): PlayerState | undefined {
    const candidates = team.onPitch.filter((p) =>
        ['ST', 'CF', 'LW', 'RW', 'CAM', 'CM'].includes(p.position) && !p.isOut,
    )
    if (candidates.length === 0) return undefined
    return candidates[Math.floor(Math.random() * candidates.length)]
}

export function toLiveState(state: MatchState): MatchLiveState {
    return {
        matchId: state.matchId,
        status: state.status,
        minute: state.minute,
        homeScore: state.home.score,
        awayScore: state.away.score,
        homeClubId: state.home.clubId,
        awayClubId: state.away.clubId,
        homePossessionMinutes: state.home.possessionMinutes,
        awayPossessionMinutes: state.away.possessionMinutes,
        homeSubstitutionsUsed: state.home.substitutionsUsed,
        awaySubstitutionsUsed: state.away.substitutionsUsed,
        events: state.events,
    }
}
