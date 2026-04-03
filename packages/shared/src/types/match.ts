export const MatchEventType = {
  KICK_OFF: 'kick_off',
  GOAL: 'goal',
  SHOT_ON_TARGET: 'shot_on_target',
  SHOT_OFF_TARGET: 'shot_off_target',
  FOUL: 'foul',
  YELLOW_CARD: 'yellow_card',
  RED_CARD: 'red_card',
  INJURY: 'injury',
  SUBSTITUTION: 'substitution',
  TACTICAL_CHANGE: 'tactical_change',
  CORNER: 'corner',
  PENALTY: 'penalty',
  SAVE: 'save',
  HALF_TIME_START: 'half_time_start',
  HALF_TIME_END: 'half_time_end',
  FULL_TIME: 'full_time',
  POSSESSION_CHANGE: 'possession_change',
} as const

export type MatchEventType = (typeof MatchEventType)[keyof typeof MatchEventType]

export const Mentality = {
  ULTRA_DEFENSIVE: 'ultra_defensive',
  DEFENSIVE: 'defensive',
  BALANCED: 'balanced',
  OFFENSIVE: 'offensive',
  ULTRA_OFFENSIVE: 'ultra_offensive',
} as const

export type Mentality = (typeof Mentality)[keyof typeof Mentality]

export const MatchZone = {
  DEFENSE: 'defense',
  MIDFIELD: 'midfield',
  ATTACK: 'attack',
} as const

export type MatchZone = (typeof MatchZone)[keyof typeof MatchZone]

export interface TacticConfig {
  formation: string
  mentality: Mentality
  pressing: 'low' | 'medium' | 'high'
  passingStyle: 'short' | 'mixed' | 'long'
  width: 'narrow' | 'normal' | 'wide'
  tempo: 'slow' | 'normal' | 'fast'
  defensiveLine: 'low' | 'medium' | 'high'
}

export interface MatchEvent {
  id?: string
  matchId: string
  minute: number
  type: MatchEventType
  clubId?: string
  playerId?: string
  secondaryPlayerId?: string
  zone?: MatchZone
  outcome: 'success' | 'failure' | 'neutral'
  metadata?: Record<string, unknown> | null
}

export interface MatchLiveState {
  matchId: string
  status: 'first_half' | 'half_time' | 'second_half' | 'finished'
  minute: number
  homeScore: number
  awayScore: number
  homeClubId: string
  awayClubId: string
  homePossessionMinutes: number
  awayPossessionMinutes: number
  homeSubstitutionsUsed: number
  awaySubstitutionsUsed: number
  events: MatchEvent[]
}

export interface MatchLineupEntry {
  playerId: string
  position: string
  isStarter: boolean
  minuteIn: number
  minuteOut: number | null
  rating: number | null
}

export interface MatchTeamStats {
  clubId: string
  possession: number
  shots: number
  shotsOnTarget: number
  fouls: number
  corners: number
  yellowCards: number
  redCards: number
  saves: number
}
