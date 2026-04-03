import { apiClient } from '~/lib/api-client'
import type { MarketListResponse, FreeAgentListResponse, OfferListResponse } from '@regista/shared'

interface FetchMarketParams {
  page?: number
  limit?: number
  source?: string
  sortBy?: string
  sortOrder?: string
}

export async function fetchMarket(params: FetchMarketParams = {}): Promise<MarketListResponse> {
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) sp.set(k, String(v))
  }
  const qs = sp.toString()
  return apiClient<MarketListResponse>(`/market${qs ? `?${qs}` : ''}`)
}

export async function fetchFreeAgents(): Promise<FreeAgentListResponse> {
  return apiClient<FreeAgentListResponse>('/market/free-agents')
}

export async function buyListing(listingId: string): Promise<void> {
  await apiClient(`/market/buy/${listingId}`, { method: 'POST' })
}

export async function sellPlayer(playerId: string, price: number): Promise<void> {
  await apiClient('/market/sell', { method: 'POST', body: JSON.stringify({ playerId, price }) })
}

export async function withdrawListing(listingId: string): Promise<void> {
  await apiClient(`/market/listings/${listingId}`, { method: 'DELETE' })
}

export async function signFreeAgent(freeAgentId: string): Promise<void> {
  await apiClient(`/market/free-agents/${freeAgentId}/sign`, { method: 'POST' })
}

export async function releasePlayer(playerId: string): Promise<void> {
  await apiClient(`/squad/${playerId}/release`, { method: 'POST' })
}

export async function fetchMyListings(): Promise<{ listings: any[] }> {
  return apiClient('/market/my-listings')
}

export async function fetchSentOffers(): Promise<OfferListResponse> {
  return apiClient<OfferListResponse>('/offers/sent')
}

export async function fetchReceivedOffers(): Promise<OfferListResponse> {
  return apiClient<OfferListResponse>('/offers/received')
}

export async function makeOffer(playerId: string, amount: number): Promise<void> {
  await apiClient('/offers', { method: 'POST', body: JSON.stringify({ playerId, amount }) })
}

export async function acceptOffer(offerId: string): Promise<void> {
  await apiClient(`/offers/${offerId}/accept`, { method: 'POST' })
}

export async function rejectOffer(offerId: string): Promise<void> {
  await apiClient(`/offers/${offerId}/reject`, { method: 'POST' })
}

export async function cancelOffer(offerId: string): Promise<void> {
  await apiClient(`/offers/${offerId}`, { method: 'DELETE' })
}
