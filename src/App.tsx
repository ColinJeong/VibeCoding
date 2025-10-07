import { useCallback, useEffect, useMemo, useState } from 'react'
import { ControlsBar } from './components/ControlsBar'
import { Header } from './components/Header'
import { ParticipantList } from './components/ParticipantList'
import { RecommendationPanel } from './components/RecommendationPanel2'
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
  const [uiError, setUiError] = useState<string>()

  const envKey = import.meta.env.VITE_KAKAO_APP_KEY as string | undefined
  const appKey = envKey && envKey.trim().length > 0 ? envKey : DEFAULT_KAKAO_APP_KEY
  const { ready: kakaoReady, error: kakaoError } = useKakaoLoader(appKey)
  const { keywordSearch: kakaoKeywordSearch, addressSearch: kakaoAddressSearch } = useGeocoder(kakaoReady)
  const recommendation = useRecommend(participants, mode)

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
      kakaoKeywordSearch('移댄럹', {
        location: { lat: centerLat, lng: centerLng },
        radius: 1000,
        size: 10,
      })
        .then(async (result) => {
          if (!result || result.length === 0) {
            const loc = { lat: centerLat, lng: centerLng }
            let widened = await kakaoKeywordSearch('카페', { location: loc, radius: 3000, size: 15 })
            if (!widened || widened.length === 0) {
              widened = await kakaoKeywordSearch('음식점', { location: loc, radius: 3000, size: 15 })
            }
            result = widened
          }
          setPlaces((result || []).slice(0, 3))
          setUiError(undefined)
        })
        .catch(() => {
          setUiError('二쇰? ?μ냼瑜?遺덈윭?ㅼ? 紐삵뻽?댁슂')
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

  const handleDeleteParticipant = useCallback((id: string) => {
    setParticipants((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const searchPlaces = useMemo(() => (keyword: string) => kakaoKeywordSearch(keyword, { size: 10 }), [kakaoKeywordSearch])
  const searchAddresses = useMemo(() => (keyword: string) => kakaoAddressSearch(keyword), [kakaoAddressSearch])

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pb-24 pt-12">
        <Header title="Vibe Coding" subtitle="Find a fair meetup place" />
        {(kakaoError || uiError) && (
          <div className="rounded-2xl border border-red-400/40 bg-red-500/10 p-4 text-sm text-red-200">
            {kakaoError || uiError}
          </div>
        )}
        {!kakaoReady && appKey && !kakaoError ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
            移댁뭅??吏??SDK瑜?遺덈윭?ㅻ뒗 以묒엯?덈떎...
          </div>
        ) : null}
        <ControlsBar mode={mode} onModeChange={setMode} onAddParticipant={handleAddParticipant} />
        <ParticipantList
          participants={participants}
          onUpdate={handleUpdateParticipant}
          onDelete={handleDeleteParticipant}
          onKeywordSearch={searchPlaces}
          onAddressSearch={searchAddresses}
          kakaoReady={kakaoReady}
        />
        {participants.length > 0 && recommendation ? (
          <RecommendationPanel
            recommendation={recommendation}
            places={places}
            loadingPlaces={loadingPlaces}
            participants={participants}
            kakaoReady={kakaoReady}
          />
        ) : null}
      </div>
    </div>
  )
}

export default App



