import { useEffect, useMemo, useState } from 'react'
import type { Participant, PlaceCandidate, Recommendation } from '../types'
import { RecommendationMapPreview } from './RecommendationMapPreview'
import { useGeocoder } from '../hooks/useGeocoder'
import { haversineDistance } from '../utils/geo'
import { WeatherCard } from './WeatherCard'
import { TransitChips } from './TransitChips'
import { ParticipantMovement } from './ParticipantMovement'

interface RecommendationPanelProps {
  recommendation: Recommendation
  places: PlaceCandidate[]
  loadingPlaces: boolean
  participants: Participant[]
  kakaoReady: boolean
}

type TransitTab = 'subway' | 'bus' | 'parking'

export function RecommendationPanel({ recommendation, places, loadingPlaces, participants, kakaoReady }: RecommendationPanelProps) {
  const { keywordSearch } = useGeocoder(kakaoReady)
  const [nearest, setNearest] = useState<{ subway: PlaceCandidate | null; bus: PlaceCandidate | null; parking: PlaceCandidate | null }>({ subway: null, bus: null, parking: null })
  const [loadingTransit, setLoadingTransit] = useState(false)
  const [transitTab, setTransitTab] = useState<TransitTab>('subway')
  const [isMapOpenMobile, setIsMapOpenMobile] = useState(false)

  useEffect(() => {
    if (!kakaoReady) return
    const center = recommendation.center
    setLoadingTransit(true)
    const run = async () => {
      try {
        const [subways, buses, parkings] = await Promise.all([
          keywordSearch('지하철역', { location: center, radius: 1500, size: 10 }),
          keywordSearch('버스정류장', { location: center, radius: 800, size: 10 }),
          keywordSearch('주차장', { location: center, radius: 1500, size: 10 }),
        ])
        const pickNearest = (arr: PlaceCandidate[]) => {
          let best: { item: PlaceCandidate; d: number } | null = null
          for (const item of arr) {
            const d = haversineDistance(center, item.latlng)
            if (!best || d < best.d) best = { item, d }
          }
          return best?.item ?? null
        }
        setNearest({ subway: pickNearest(subways), bus: pickNearest(buses), parking: pickNearest(parkings) })
      } finally {
        setLoadingTransit(false)
      }
    }
    void run()
  }, [kakaoReady, keywordSearch, recommendation.center.lat, recommendation.center.lng])

  // movement ETA handled by ParticipantMovement

  const kakaoRouteLinkFor = (from: { name: string; lat: number; lng: number }, to: { name: string; lat: number; lng: number }) => {
    const fromName = encodeURIComponent(from.name || '출발지')
    const toName = encodeURIComponent(to.name || '도착지')
    return `https://map.kakao.com/link/from/${fromName},${from.lat},${from.lng}/to/${toName},${to.lat},${to.lng}`
  }

  const kakaoRouteLink = useMemo(() => {
    const name = encodeURIComponent('추천 지점')
    return `https://map.kakao.com/link/to/${name},${recommendation.center.lat},${recommendation.center.lng}`
  }, [recommendation.center.lat, recommendation.center.lng])

  const activeTransitPlace = nearest[transitTab]

  return (
    <section className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <SummaryCard title="추천 위도" value={recommendation.center.lat.toFixed(6)} suffix="°" />
        <SummaryCard title="추천 경도" value={recommendation.center.lng.toFixed(6)} suffix="°" />
        <div className="card-surface flex flex-col gap-2">
          <span className="label-text">추천 지점</span>
          <a className="inline-flex w-fit items-center gap-2 rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-amber-500/30 transition hover:bg-amber-300" href={kakaoRouteLink} target="_blank" rel="noreferrer">
            길찾기
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="card-surface">
          <div className="flex items-center justify-between">
            <span className="label-text">가까운 대중교통</span>
            <TransitChips value={transitTab} onChange={setTransitTab} />
          </div>
          <div className="mt-3 text-sm text-slate-200">
            {loadingTransit ? '불러오는 중...' : activeTransitPlace ? (
              <>
                <p className="font-semibold">{activeTransitPlace.name}</p>
                <p className="mt-0.5 text-xs text-slate-400">{activeTransitPlace.address}</p>
              </>
            ) : (
              <span className="text-slate-400">—</span>
            )}
          </div>
        </div>
        <WeatherCard lat={recommendation.center.lat} lng={recommendation.center.lng} />
      </div>

      <div className="hidden md:block">
        {kakaoReady ? (
          <RecommendationMapPreview center={recommendation.center} participants={participants} kakaoReady={kakaoReady} />
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-300">카카오 지도 SDK가 아직 로드되지 않았어요.</div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card-surface">
          <h2 className="text-lg font-semibold text-white">참여자 이동</h2>
          <p className="mt-1 text-sm text-slate-400">이름 · 직선거리 · ETA(도보/자동차/자전거/대중교통)</p>
          <ParticipantMovement center={recommendation.center} participants={participants} />
        </div>
        <div className="card-surface">
          <h2 className="text-lg font-semibold text-white">주변 장소 TOP3</h2>
          <p className="mt-1 text-sm text-slate-400">중앙 좌표 반경 1km 내 추천 장소에요.</p>
          <PlaceCandidatesList places={places} loading={loadingPlaces} />
        </div>
      </div>

      {/* Mobile: bottom collapsible map */}
      <div className="md:hidden">
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-slate-950/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2">
            <span className="text-xs text-slate-400">추천 지도</span>
            <button type="button" className="rounded-md border border-white/10 px-3 py-1 text-xs text-slate-200" onClick={() => setIsMapOpenMobile((v) => !v)}>
              {isMapOpenMobile ? '접기' : '열기'}
            </button>
          </div>
          {isMapOpenMobile ? (
            <div className="px-4 pb-4">
              {kakaoReady ? (
                <RecommendationMapPreview center={recommendation.center} participants={participants} kakaoReady={kakaoReady} />
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-300">카카오 지도 SDK가 아직 로드되지 않았어요.</div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}

function SummaryCard({ title, value, suffix }: { title: string; value: string; suffix?: string }) {
  return (
    <div className="card-surface flex flex-col gap-2">
      <span className="label-text">{title}</span>
      <span className="text-2xl font-semibold text-white">
        {value}
        {suffix ? <span className="ml-1 text-sm text-slate-400">{suffix}</span> : null}
      </span>
    </div>
  )
}

function PlaceCandidatesList({ places, loading }: { places: PlaceCandidate[]; loading: boolean }) {
  if (loading) {
    return <p className="mt-4 text-sm text-slate-400">주변 장소를 불러오는 중이에요...</p>
  }
  if (!loading && places.length === 0) {
    return <p className="mt-4 text-sm text-slate-400">주변 추천 장소가 없어요.</p>
  }
  return (
    <div className="mt-4 flex flex-col gap-3">
      {places.slice(0, 3).map((place) => (
        <a key={place.placeId} href={place.kakaoMapUrl} target="_blank" rel="noreferrer" className="block rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-amber-400/50 hover:bg-amber-400/5">
          <p className="text-sm font-semibold text-white">{place.name}</p>
          <p className="mt-1 text-xs text-slate-400">{place.address}</p>
        </a>
      ))}
    </div>
  )
}
