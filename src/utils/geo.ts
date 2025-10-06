import type { LatLng, Participant, Recommendation } from '../types'

type WeightedPoint = { loc: LatLng; weight: number }

const EARTH_RADIUS_KM = 6371

const toRad = (value: number) => (value * Math.PI) / 180

export function haversineDistance(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)

  const sinDlat = Math.sin(dLat / 2)
  const sinDlng = Math.sin(dLng / 2)

  const h = sinDlat * sinDlat + Math.cos(lat1) * Math.cos(lat2) * sinDlng * sinDlng
  const distance = 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(Math.max(0, h)))
  return Number.isFinite(distance) ? distance : 0
}

export function weightedMean(points: WeightedPoint[]): LatLng {
  const totalWeight = points.reduce((sum, p) => sum + (p.weight || 0), 0)
  if (totalWeight === 0) {
    return { lat: 0, lng: 0 }
  }
  const lat = points.reduce((sum, p) => sum + p.loc.lat * (p.weight || 0), 0) / totalWeight
  const lng = points.reduce((sum, p) => sum + p.loc.lng * (p.weight || 0), 0) / totalWeight
  return { lat, lng }
}

export function geometricMedian(points: WeightedPoint[], epsilon = 1e-6, maxIter = 200): LatLng {
  if (points.length === 0) {
    return { lat: 0, lng: 0 }
  }
  let current = weightedMean(points)
  for (let i = 0; i < maxIter; i += 1) {
    let numeratorLat = 0
    let numeratorLng = 0
    let denominator = 0
    let coincident = false

    for (const point of points) {
      const dist = haversineDistance(current, point.loc)
      if (dist === 0) {
        coincident = true
        continue
      }
      const weight = point.weight || 0
      const inv = weight / dist
      numeratorLat += point.loc.lat * inv
      numeratorLng += point.loc.lng * inv
      denominator += inv
    }

    if (coincident || denominator === 0) {
      return current
    }

    const next = {
      lat: numeratorLat / denominator,
      lng: numeratorLng / denominator,
    }
    if (haversineDistance(current, next) < epsilon) {
      return next
    }
    current = next
  }
  return current
}

function approxKmToLatDelta(km: number): number {
  return km / 110.574
}

function approxKmToLngDelta(km: number, latitude: number): number {
  return km / (111.320 * Math.cos(toRad(latitude)) || 1)
}

export function minimaxCenter(points: WeightedPoint[], stepKm = 1, radiusKm = 6): LatLng {
  if (points.length === 0) {
    return { lat: 0, lng: 0 }
  }
  const base = weightedMean(points)
  const latStep = approxKmToLatDelta(stepKm)
  const lngStep = approxKmToLngDelta(stepKm, base.lat)
  const latRadius = approxKmToLatDelta(radiusKm)
  const lngRadius = approxKmToLngDelta(radiusKm, base.lat)

  let best = base
  let bestScore = Number.POSITIVE_INFINITY

  for (let lat = base.lat - latRadius; lat <= base.lat + latRadius; lat += latStep) {
    for (let lng = base.lng - lngRadius; lng <= base.lng + lngRadius; lng += lngStep) {
      const center = { lat, lng }
      let maxDistance = 0
      for (const point of points) {
        const dist = haversineDistance(center, point.loc)
        const weightedDist = dist * (point.weight || 0)
        if (weightedDist > maxDistance) {
          maxDistance = weightedDist
        }
      }
      if (maxDistance < bestScore) {
        bestScore = maxDistance
        best = center
      }
    }
  }

  return best
}

export function computeRecommendation(participants: Participant[], mode: 'median' | 'mean' | 'minimax'): Recommendation | undefined {
  if (participants.length === 0) {
    return undefined
  }

  const weightedPoints = participants.map((p) => ({ loc: p.loc, weight: p.weight }))

  let center: LatLng
  switch (mode) {
    case 'mean':
      center = weightedMean(weightedPoints)
      break
    case 'minimax':
      center = minimaxCenter(weightedPoints)
      break
    case 'median':
    default:
      center = geometricMedian(weightedPoints)
      break
  }

  const perPerson = participants.map((p, index) => ({
    name: p.name || `참여자 ${index + 1}`,
    distanceKm: Number(haversineDistance(center, p.loc).toFixed(2)),
  }))

  const totalDistanceKm = Number(perPerson.reduce((sum, item) => sum + item.distanceKm, 0).toFixed(2))
  const distances = perPerson.map((item) => item.distanceKm)
  const minDistanceKm = distances.length > 0 ? Number(Math.min(...distances).toFixed(2)) : 0
  const maxDistanceKm = distances.length > 0 ? Number(Math.max(...distances).toFixed(2)) : 0

  return {
    center: {
      lat: Number(center.lat.toFixed(6)),
      lng: Number(center.lng.toFixed(6)),
    },
    totalDistanceKm,
    minDistanceKm,
    maxDistanceKm,
    perPerson,
  }
}
