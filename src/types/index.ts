export type LatLng = { lat: number; lng: number }

export type Participant = {
  id: string
  name: string
  address?: string
  loc: LatLng
  weight: number
}

export type DistanceItem = {
  name: string
  distanceKm: number
}

export type Recommendation = {
  center: LatLng
  totalDistanceKm: number
  minDistanceKm: number
  maxDistanceKm: number
  perPerson: DistanceItem[]
}

export type PlaceCandidate = {
  placeId: string
  name: string
  address: string
  latlng: LatLng
  kakaoMapUrl: string
}

export type RecommendMode = 'median' | 'mean' | 'minimax'
