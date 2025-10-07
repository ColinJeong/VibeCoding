import { useEffect, useMemo, useState } from 'react'
import type { Participant, Recommendation } from '../types'
import { haversineDistance } from '../utils/geo'
import { getEta, formatEta } from '../lib/eta'

export function ParticipantMovement({ center, participants }: { center: Recommendation['center']; participants: Participant[] }) {
  const [etaMap, setEtaMap] = useState<Record<string, { walk: number | null; car: number | null; bike: number | null; transit: number | null }>>({})

  useEffect(() => {
    const run = async () => {
      const entries = await Promise.all(
        participants.map(async (p) => {
          const [walk, car, bike] = await Promise.all([
            getEta({ from: p.loc, to: center, mode: 'walk' }),
            getEta({ from: p.loc, to: center, mode: 'car' }),
            getEta({ from: p.loc, to: center, mode: 'bike' }),
          ])
          return [p.id, { walk, car, bike, transit: null }] as const
        }),
      )
      const map: Record<string, { walk: number | null; car: number | null; bike: number | null; transit: number | null }> = {}
      entries.forEach(([id, value]) => (map[id] = value))
      setEtaMap(map)
    }
    void run()
  }, [participants, center.lat, center.lng])

  const header = (
    <div className="grid grid-cols-1 items-center gap-2 text-xs text-slate-400 sm:grid-cols-3">
      <div>이름</div>
      <div className="hidden sm:block">직선거리</div>
      <div className="sm:text-right">ETA</div>
    </div>
  )

  return (
    <div className="mt-4">
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
        {header}
        <div className="mt-2 divide-y divide-white/10">
          {participants.map((p, idx) => {
            const name = p.name?.trim() || `참여자 ${idx + 1}`
            const dKm = haversineDistance(center, p.loc)
            const eta = etaMap[p.id]
            const tooltip = '직선거리 기준. 실제 경로/교통 상황에 따라 달라질 수 있습니다.'
            return (
              <div key={p.id} className="grid grid-cols-1 items-center gap-2 py-2 text-sm hover:bg-white/[0.03] sm:grid-cols-3" title={tooltip}>
                <div className="text-slate-100">{name}</div>
                <div className="hidden sm:block text-slate-300">{dKm.toFixed(2)} km</div>
                <div className="sm:text-right text-slate-300">
                  <span className="mr-2">🚶 도보 {formatEta(eta?.walk ?? null)}</span>
                  <span className="mr-2">🚗 자동차 {formatEta(eta?.car ?? null)}</span>
                  <span className="mr-2">🚴 자전거 {formatEta(eta?.bike ?? null)}</span>
                  <span>🚇 대중교통 —</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

