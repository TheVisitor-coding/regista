export const PlayerPosition = {
  GK: 'GK',
  CB: 'CB',
  LB: 'LB',
  RB: 'RB',
  CDM: 'CDM',
  CM: 'CM',
  CAM: 'CAM',
  LW: 'LW',
  RW: 'RW',
  ST: 'ST',
  CF: 'CF',
} as const

export type PlayerPosition = (typeof PlayerPosition)[keyof typeof PlayerPosition]

export const PositionLine = {
  GK: 'GK',
  DEF: 'DEF',
  MID: 'MID',
  ATT: 'ATT',
} as const

export type PositionLine = (typeof PositionLine)[keyof typeof PositionLine]

export const POSITION_TO_LINE: Record<PlayerPosition, PositionLine> = {
  GK: 'GK',
  CB: 'DEF',
  LB: 'DEF',
  RB: 'DEF',
  CDM: 'MID',
  CM: 'MID',
  CAM: 'MID',
  LW: 'ATT',
  RW: 'ATT',
  ST: 'ATT',
  CF: 'ATT',
}

export interface PlayerStats {
  pace: number
  stamina: number
  strength: number
  agility: number
  passing: number
  shooting: number
  dribbling: number
  crossing: number
  heading: number
  vision: number
  composure: number
  workRate: number
  positioning: number
  tackling: number
  marking: number
  penalties: number
  freeKick: number
}

export interface GoalkeeperStats {
  reflexes: number
  diving: number
  handling: number
  positioning: number
  kicking: number
  communication: number
  penalties: number
  freeKick: number
}

export interface Player {
  id: string
  clubId: string | null
  firstName: string
  lastName: string
  nationality: string
  age: number
  position: PlayerPosition
  secondaryPositions: PlayerPosition[]
  overall: number
  potential: number
  fatigue: number
  isInjured: boolean
  injuryMatchesRemaining: number
  injuryType: string | null
  isSuspended: boolean
  suspensionMatchesRemaining: number
  yellowCardsSeason: number
  contractMatchesRemaining: number
  weeklySalary: number
  releaseClause: number
  createdAt: string
  updatedAt: string
}

export interface PlayerWithStats extends Player {
  stats: PlayerStats | null
  goalkeeperStats: GoalkeeperStats | null
}

export interface PlayerListItem {
  id: string
  firstName: string
  lastName: string
  position: PlayerPosition
  overall: number
  fatigue: number
  isInjured: boolean
  isSuspended: boolean
  age: number
  weeklySalary: number
}

/** Position weights for overall calculation (weights sum to 100 per position) */
export const POSITION_WEIGHTS: Record<PlayerPosition, Record<string, number>> = {
  GK: { reflexes: 20, diving: 20, handling: 20, positioning: 20, kicking: 10, communication: 10 },
  CB: { tackling: 20, marking: 20, heading: 15, strength: 15, positioning: 15, composure: 10, pace: 5 },
  LB: { pace: 15, tackling: 15, marking: 10, crossing: 15, stamina: 15, passing: 10, positioning: 10, workRate: 10 },
  RB: { pace: 15, tackling: 15, marking: 10, crossing: 15, stamina: 15, passing: 10, positioning: 10, workRate: 10 },
  CDM: { tackling: 20, marking: 15, passing: 15, positioning: 15, stamina: 10, strength: 10, workRate: 10, vision: 5 },
  CM: { passing: 20, vision: 15, stamina: 15, workRate: 10, tackling: 10, shooting: 10, positioning: 10, composure: 10 },
  CAM: { vision: 20, passing: 20, shooting: 15, dribbling: 15, composure: 15, agility: 10, positioning: 5 },
  LW: { pace: 20, dribbling: 20, crossing: 15, shooting: 10, agility: 15, stamina: 10, workRate: 10 },
  RW: { pace: 20, dribbling: 20, crossing: 15, shooting: 10, agility: 15, stamina: 10, workRate: 10 },
  ST: { shooting: 25, composure: 15, positioning: 15, heading: 10, pace: 10, dribbling: 10, strength: 10, agility: 5 },
  CF: { shooting: 20, passing: 15, vision: 15, composure: 15, dribbling: 10, positioning: 15, heading: 10 },
}
