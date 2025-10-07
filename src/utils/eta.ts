import type { LatLng } from '../types'
import { haversineDistance } from './geo'

export type TravelMode = 'walk' | 'car' | 'bike' | 'transit'

const SPEEDS_KMH: Record<Exclude<TravelMode, 'transit'>, number> = {
  walk: 4.5,
  car: 30,
  bike: 15,
}

export async function getEta({ from, to, mode }: { from: LatLng; to: LatLng; mode: TravelMode }): Promise<number | null> {
  // Extension point: replace with real routing API later.
  if (mode === 'transit') return null
  const km = haversineDistance(from, to)
  const speed = SPEEDS_KMH[mode]
  if (!speed || !Number.isFinite(km)) return null
  const hours = km / speed
  const minutes = Math.max(1, Math.round(hours * 60))
  return minutes
}

export function formatEta(mins: number | null): string {
  if (mins == null) return '—'
  return `${mins}분`
}

