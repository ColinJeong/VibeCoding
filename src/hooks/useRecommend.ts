import { useMemo } from 'react'
import type { Participant, RecommendMode, Recommendation } from '../types'
import { computeRecommendation } from '../utils/geo'

export function useRecommend(participants: Participant[], mode: RecommendMode): Recommendation | undefined {
  return useMemo(() => computeRecommendation(participants, mode), [participants, mode])
}
