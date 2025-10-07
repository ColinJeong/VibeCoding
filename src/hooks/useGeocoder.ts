import { useCallback, useEffect, useRef } from 'react'
import type { LatLng, PlaceCandidate } from '../types'

type KeywordSearchOptions = {
  size?: number
  location?: LatLng
  radius?: number
}

type GeocoderApi = {
  reverseGeocode: (loc: LatLng) => Promise<string | undefined>
  keywordSearch: (keyword: string, options?: KeywordSearchOptions) => Promise<PlaceCandidate[]>
  addressSearch: (query: string) => Promise<PlaceCandidate[]>
}

export function useGeocoder(ready: boolean): GeocoderApi {
  const geocoderRef = useRef<any>(null)
  const placesRef = useRef<any>(null)

  useEffect(() => {
    if (!ready || typeof window === 'undefined' || !(window as any).kakao?.maps?.services) {
      return
    }
    geocoderRef.current = new (window as any).kakao.maps.services.Geocoder()
    placesRef.current = new (window as any).kakao.maps.services.Places()
  }, [ready])

  const reverseGeocode = useCallback(async (loc: LatLng) => {
    if (!ready || !geocoderRef.current) {
      return undefined
    }

    return new Promise<string | undefined>((resolve) => {
      geocoderRef.current.coord2Address(loc.lng, loc.lat, (result: any, status: any) => {
        if (status === (window as any).kakao.maps.services.Status.OK && result.length > 0) {
          const first = result[0]
          const address = first.road_address?.address_name ?? first.address?.address_name
          resolve(address ?? undefined)
        } else {
          resolve(undefined)
        }
      })
    })
  }, [ready])

  const keywordSearch = useCallback(async (keyword: string, options?: KeywordSearchOptions) => {
    if (!ready || !placesRef.current) {
      return []
    }
    const searchOptions: Record<string, unknown> = {}
    if (options?.size) searchOptions.size = options.size
    if (options?.location) {
      searchOptions.location = new (window as any).kakao.maps.LatLng(options.location.lat, options.location.lng)
    }
    if (options?.radius) searchOptions.radius = options.radius

    return new Promise<PlaceCandidate[]>((resolve) => {
      placesRef.current.keywordSearch(
        keyword,
        (data: any[], status: string) => {
          if (status !== (window as any).kakao.maps.services.Status.OK || !Array.isArray(data)) {
            resolve([])
            return
          }
          const mapped = data.map((item) => {
            const lat = Number(item.y)
            const lng = Number(item.x)
            return {
              placeId: item.id ?? item.place_id ?? `${item.x}-${item.y}`,
              name: item.place_name ?? item.name ?? '알 수 없는 장소',
              address: item.road_address_name || item.address_name || '',
              latlng: { lat, lng },
              kakaoMapUrl: item.place_url || `https://map.kakao.com/link/map/${encodeURIComponent(item.place_name ?? '')},${lat},${lng}`,
            }
          }) as PlaceCandidate[]
          resolve(mapped)
        },
        searchOptions,
      )
    })
  }, [ready])

  const addressSearch = useCallback(async (query: string) => {
    if (!ready || !geocoderRef.current) {
      return []
    }
    return new Promise<PlaceCandidate[]>((resolve) => {
      geocoderRef.current.addressSearch(query, (result: any[], status: string) => {
        if (status !== (window as any).kakao.maps.services.Status.OK || !Array.isArray(result)) {
          resolve([])
          return
        }
        const mapped = result
          .map((item) => {
            const lat = Number(item.y)
            const lng = Number(item.x)
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
            return {
              placeId: item.address_name ?? `${lat},${lng}`,
              name: item.address_name ?? '주소',
              address: item.road_address?.address_name || item.address_name || '',
              latlng: { lat, lng },
              kakaoMapUrl: `https://map.kakao.com/link/map/${encodeURIComponent(item.address_name ?? '주소')},${lat},${lng}`,
            } as PlaceCandidate
          })
          .filter(Boolean) as PlaceCandidate[]
        resolve(mapped)
      })
    })
  }, [ready])

  return {
    reverseGeocode,
    keywordSearch,
    addressSearch,
  }
}
export type { KeywordSearchOptions }
