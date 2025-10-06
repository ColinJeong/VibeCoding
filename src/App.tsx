import { useCallback, useEffect, useMemo, useState } from 'react'
import { ControlsBar } from './components/ControlsBar'
import { Header } from './components/Header'
import { MapPickerModal } from './components/MapPickerModal'
import { ParticipantList } from './components/ParticipantList'
import { RecommendationPanel } from './components/RecommendationPanel'
import { useGeocoder } from './hooks/useGeocoder'
import { useKakaoLoader } from './hooks/useKakaoLoader'
import { useRecommend } from './hooks/useRecommend'
import type { Participant, PlaceCandidate, RecommendMode } from './types'

const DEFAULT_LOCATION = { lat: 37.5665, lng: 126.978 }
const DEFAULT_KAKAO_APP_KEY = 'f0c6ee831104d4f7be33e73418785693'

const generateId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `p-${Math.random().toString(36).slice(2, 10)}`
}

const createParticipant = (): Participant => ({
  id: generateId(),
  name: '',
  address: '',
  loc: { ...DEFAULT_LOCATION },
  weight: 1,
})

function App() {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [mode, setMode] = useState<RecommendMode>('median')
  const [places, setPlaces] = useState<PlaceCandidate[]>([])
  const [loadingPlaces, setLoadingPlaces] = useState(false)
  const [mapPickerOpen, setMapPickerOpen] = useState(false)
  const [editingParticipantId, setEditingParticipantId] = useState<string>()
  const [uiError, setUiError] = useState<string>()

  const envKey = import.meta.env.VITE_KAKAO_APP_KEY as string | undefined
  const appKey = envKey && envKey.trim().length > 0 ? envKey : DEFAULT_KAKAO_APP_KEY
  const { ready: kakaoReady, error: kakaoError } = useKakaoLoader(appKey)
  const { reverseGeocode, keywordSearch: kakaoKeywordSearch } = useGeocoder(kakaoReady)
  const recommendation = useRecommend(participants, mode)

  const editingParticipant = useMemo(
    () => participants.find((item) => item.id === editingParticipantId),
    [editingParticipantId, participants],
  )

  useEffect(() => {
    const centerLat = recommendation?.center.lat
    const centerLng = recommendation?.center.lng

    if (!kakaoReady || centerLat === undefined || centerLng === undefined) {
      setPlaces([])
      setLoadingPlaces(false)
      if (participants.length === 0) {
        setUiError(undefined)
      }
      return
    }

    setLoadingPlaces(true)
    const timeoutId = window.setTimeout(() => {
      kakaoKeywordSearch('카페', {
        location: { lat: centerLat, lng: centerLng },
        radius: 1000,
        size: 10,
      })
        .then((result) => {
          setPlaces(result.slice(0, 3))
          setUiError(undefined)
        })
        .catch(() => {
          setUiError('주변 장소를 불러오지 못했습니다.')
          setPlaces([])
        })
        .finally(() => {
          setLoadingPlaces(false)
        })
    }, 300)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [kakaoReady, kakaoKeywordSearch, participants.length, recommendation?.center.lat, recommendation?.center.lng])

  const handleAddParticipant = useCallback(() => {
    setParticipants((prev) => [...prev, createParticipant()])
  }, [])

  const handleUpdateParticipant = useCallback((id: string, next: Participant) => {
    setParticipants((prev) => prev.map((item) => (item.id === id ? next : item)))
  }, [])

  const handleDeleteParticipant = useCallback(
    (id: string) => {
      setParticipants((prev) => prev.filter((item) => item.id !== id))
      if (editingParticipantId === id) {
        setMapPickerOpen(false)
        setEditingParticipantId(undefined)
      }
    },
    [editingParticipantId],
  )

  const openMapForParticipant = useCallback((id: string) => {
    setEditingParticipantId(id)
    setMapPickerOpen(true)
  }, [])

  const handleSelectLocation = useCallback(
    (value: { latlng: { lat: number; lng: number }; address?: string }) => {
      if (!editingParticipantId) {
        return
      }
      setParticipants((prev) =>
        prev.map((item) =>
          item.id === editingParticipantId
            ? {
                ...item,
                loc: { ...value.latlng },
                address: value.address ?? item.address,
              }
            : item,
        ),
      )
    },
    [editingParticipantId],
  )

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pb-16 pt-12">
        <Header title="Vibe Coding" subtitle="모두가 공평한 약속 장소를 찾기 위한 카카오맵 기반 도우미" />
        {(kakaoError || uiError) && (
          <div className="rounded-2xl border border-red-400/40 bg-red-500/10 p-4 text-sm text-red-200">
            {kakaoError || uiError}
          </div>
        )}
        {!kakaoReady && appKey && !kakaoError ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
            카카오 지도 SDK를 불러오는 중입니다...
          </div>
        ) : null}
        <ControlsBar mode={mode} onModeChange={setMode} onAddParticipant={handleAddParticipant} />
        <ParticipantList
          participants={participants}
          onUpdate={handleUpdateParticipant}
          onDelete={handleDeleteParticipant}
          onRequestMap={openMapForParticipant}
        />
        {participants.length > 0 && recommendation ? (
          <RecommendationPanel recommendation={recommendation} places={places} loadingPlaces={loadingPlaces} />
        ) : null}
      </div>
      <MapPickerModal
        open={mapPickerOpen}
        kakaoReady={kakaoReady}
        initialLocation={editingParticipant?.loc ?? DEFAULT_LOCATION}
        onClose={() => setMapPickerOpen(false)}
        onSelect={handleSelectLocation}
        reverseGeocode={reverseGeocode}
        keywordSearch={(keyword: string) => kakaoKeywordSearch(keyword, { size: 5 })}
      />
    </div>
  )
}

export default App
