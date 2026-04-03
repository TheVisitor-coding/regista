export const SeasonStatus = {
  CREATED: 'created',
  IN_PROGRESS: 'in_progress',
  FINISHING: 'finishing',
  INTERSAISON: 'intersaison',
  ARCHIVED: 'archived',
} as const

export type SeasonStatus = (typeof SeasonStatus)[keyof typeof SeasonStatus]

export const MatchStatus = {
  SCHEDULED: 'scheduled',
  LIVE: 'live',
  FINISHED: 'finished',
  CANCELLED: 'cancelled',
} as const

export type MatchStatus = (typeof MatchStatus)[keyof typeof MatchStatus]

export const AiProfile = {
  OFFENSIVE: 'offensive',
  BALANCED: 'balanced',
  DEFENSIVE: 'defensive',
} as const

export type AiProfile = (typeof AiProfile)[keyof typeof AiProfile]

export const StandingZone = {
  CHAMPION: 'champion',
  PROMOTION: 'promotion',
  NEUTRAL: 'neutral',
  RELEGATION: 'relegation',
} as const

export type StandingZone = (typeof StandingZone)[keyof typeof StandingZone]

export interface League {
  id: string
  name: string
  matchTime: string
  createdAt: string
}

export interface Division {
  id: string
  leagueId: string
  level: number
  name: string
  createdAt: string
}

export interface Season {
  id: string
  divisionId: string
  number: number
  status: SeasonStatus
  startedAt: string | null
  finishedAt: string | null
  totalMatchdays: number
  currentMatchday: number
  createdAt: string
}

export interface Standing {
  id: string
  seasonId: string
  clubId: string
  position: number
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
  homeWon: number
  homeDrawn: number
  homeLost: number
  awayWon: number
  awayDrawn: number
  awayLost: number
  form: string
}

export interface StandingWithClub extends Standing {
  club: {
    id: string
    name: string
    logoId: string
    primaryColor: string
  }
  zone: StandingZone
  isCurrentClub: boolean
}

export interface Match {
  id: string
  seasonId: string
  matchday: number
  homeClub: { id: string; name: string; logoId: string; primaryColor: string }
  awayClub: { id: string; name: string; logoId: string; primaryColor: string }
  scheduledAt: string
  status: MatchStatus
  homeScore: number | null
  awayScore: number | null
}

export interface SeasonResult {
  id: string
  seasonId: string
  clubId: string
  finalPosition: number
  points: number
  promoted: boolean
  relegated: boolean
  champion: boolean
  prizeMoney: number
}

export interface NotificationPreference {
  matchReminders: boolean
  matchResults: boolean
  standingChanges: boolean
  squadAlerts: boolean
  financeAlerts: boolean
  transferAlerts: boolean
}

// Response types

export interface CompetitionInfoResponse {
  league: { id: string; name: string }
  division: { id: string; name: string; level: number }
  season: { id: string; number: number; status: SeasonStatus; currentMatchday: number; totalMatchdays: number }
}

export interface StandingsResponse extends CompetitionInfoResponse {
  standings: StandingWithClub[]
}

export interface MatchdayResponse {
  matchday: number
  matches: Match[]
}

export interface MatchListResponse {
  matches: Match[]
  total: number
  page: number
  limit: number
}
