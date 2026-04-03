export const StaffRole = {
  ASSISTANT: 'assistant',
  DOCTOR: 'doctor',
  SPORTING_DIRECTOR: 'sporting_director',
  SECRETARY: 'secretary',
} as const

export type StaffRole = (typeof StaffRole)[keyof typeof StaffRole]

export interface ClubStaff {
  id: string
  clubId: string
  role: StaffRole
  firstName: string
  lastName: string
  avatarId: string
  createdAt: string
}

export interface Club {
  id: string
  userId: string
  name: string
  primaryColor: string
  secondaryColor: string
  logoId: string
  stadiumName: string
  balance: number
  morale: number
  leagueId: string | null
  divisionId: string | null
  isAi: boolean
  aiProfile: string | null
  nameChangesRemaining: number
  createdAt: string
  updatedAt: string
}

export interface CreateClubRequest {
  name: string
  primaryColor: string
  secondaryColor: string
  logoId: string
  stadiumName?: string
}

export interface ClubResponse {
  club: Club
  squadSize?: number
}

export const MoraleLabel = {
  EXCELLENT: 'excellent',
  GOOD: 'good',
  NEUTRAL: 'neutral',
  POOR: 'poor',
  CRITICAL: 'critical',
} as const

export type MoraleLabel = (typeof MoraleLabel)[keyof typeof MoraleLabel]
