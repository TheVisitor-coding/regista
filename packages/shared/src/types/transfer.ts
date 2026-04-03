export const TransferListingSource = {
  AI_MARKET: 'ai_market',
  HUMAN_LISTING: 'human_listing',
} as const

export type TransferListingSource = (typeof TransferListingSource)[keyof typeof TransferListingSource]

export const TransferListingStatus = {
  ACTIVE: 'active',
  SOLD: 'sold',
  EXPIRED: 'expired',
  WITHDRAWN: 'withdrawn',
} as const

export type TransferListingStatus = (typeof TransferListingStatus)[keyof typeof TransferListingStatus]

export const TransferOfferStatus = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  COUNTER_OFFERED: 'counter_offered',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
} as const

export type TransferOfferStatus = (typeof TransferOfferStatus)[keyof typeof TransferOfferStatus]

export interface TransferListing {
  id: string
  playerId: string
  sellerClubId: string | null
  source: TransferListingSource
  price: number
  status: TransferListingStatus
  listedAt: string
  expiresAt: string | null
  player?: {
    firstName: string
    lastName: string
    position: string
    overall: number
    potential: number
    age: number
    nationality: string
  }
  sellerClub?: {
    id: string
    name: string
  }
}

export interface TransferOffer {
  id: string
  playerId: string
  fromClubId: string
  toClubId: string
  amount: number
  status: TransferOfferStatus
  counterAmount: number | null
  counterStatus: string | null
  expiresAt: string
  createdAt: string
  player?: {
    firstName: string
    lastName: string
    position: string
    overall: number
  }
  fromClub?: { id: string; name: string }
  toClub?: { id: string; name: string }
}

export interface TransferHistoryEntry {
  id: string
  playerId: string
  fromClubId: string | null
  toClubId: string | null
  type: string
  fee: number
  createdAt: string
}

export interface FreeAgent {
  id: string
  playerId: string
  previousClubId: string | null
  reason: string
  penaltyApplied: boolean
  expiresAt: string
  createdAt: string
  player?: {
    firstName: string
    lastName: string
    position: string
    overall: number
    age: number
    nationality: string
  }
}

export interface PlayerValuation {
  marketValue: number
  baseValue: number
  ageModifier: number
  potentialModifier: number
  positionModifier: number
  contractModifier: number
}

export interface MarketListResponse {
  listings: TransferListing[]
  total: number
  page: number
  limit: number
}

export interface FreeAgentListResponse {
  freeAgents: FreeAgent[]
  total: number
}

export interface OfferListResponse {
  offers: TransferOffer[]
  total: number
}
