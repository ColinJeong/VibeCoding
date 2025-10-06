import type { PlaceCandidate, Recommendation } from '../types'

interface RecommendationPanelProps {
  recommendation: Recommendation
  places: PlaceCandidate[]
  loadingPlaces: boolean
}

const formatDistance = (value: number) => `${value.toFixed(2)} km`

export function RecommendationPanel({ recommendation, places, loadingPlaces }: RecommendationPanelProps) {
  const kakaoLink = `https://map.kakao.com/link/map/${recommendation.center.lat},${recommendation.center.lng}`

  return (
    <section className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard title="추천 위도" value={recommendation.center.lat.toFixed(6)} suffix="°" />
        <SummaryCard title="추천 경도" value={recommendation.center.lng.toFixed(6)} suffix="°" />
        <SummaryCard title="총 이동거리" value={formatDistance(recommendation.totalDistanceKm)} />
        <SummaryCard title="최소 / 최대" value={`${recommendation.minDistanceKm.toFixed(2)} / ${recommendation.maxDistanceKm.toFixed(2)} km`} />
      </div>
      <a
        className="inline-flex w-fit items-center gap-2 rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-amber-500/30 transition hover:bg-amber-300"
        href={kakaoLink}
        target="_blank"
        rel="noreferrer"
      >
        카카오맵에서 열기
      </a>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card-surface">
          <h2 className="text-lg font-semibold text-white">인원별 이동거리</h2>
          <p className="mt-1 text-sm text-slate-400">추천 좌표까지의 거리입니다.</p>
          <DistanceTable items={recommendation.perPerson} />
        </div>
        <div className="card-surface">
          <h2 className="text-lg font-semibold text-white">후보 장소 TOP3</h2>
          <p className="mt-1 text-sm text-slate-400">중앙점 반경 1km 내 추천 장소입니다.</p>
          <PlaceCandidatesList places={places} loading={loadingPlaces} />
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

function DistanceTable({ items }: { items: Recommendation['perPerson'] }) {
  if (items.length === 0) {
    return <p className="mt-4 text-sm text-slate-400">데이터가 없습니다.</p>
  }

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
      <table className="min-w-full divide-y divide-white/10 text-sm">
        <thead className="bg-white/5 text-left text-xs uppercase tracking-wide text-slate-400">
          <tr>
            <th className="px-4 py-3">이름</th>
            <th className="px-4 py-3 text-right">거리</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.name} className="border-b border-white/5 bg-white/[0.02]">
              <td className="px-4 py-3 text-slate-100">{item.name}</td>
              <td className="px-4 py-3 text-right text-amber-200">{formatDistance(item.distanceKm)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PlaceCandidatesList({ places, loading }: { places: PlaceCandidate[]; loading: boolean }) {
  if (loading) {
    return <p className="mt-4 text-sm text-slate-400">주변 장소를 불러오는 중...</p>
  }

  if (!loading && places.length === 0) {
    return <p className="mt-4 text-sm text-slate-400">주변 추천 장소가 없습니다.</p>
  }

  return (
    <div className="mt-4 flex flex-col gap-3">
      {places.slice(0, 3).map((place) => (
        <a
          key={place.placeId}
          href={place.kakaoMapUrl}
          target="_blank"
          rel="noreferrer"
          className="block rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-amber-400/50 hover:bg-amber-400/5"
        >
          <p className="text-sm font-semibold text-white">{place.name}</p>
          <p className="mt-1 text-xs text-slate-400">{place.address}</p>
        </a>
      ))}
    </div>
  )
}
