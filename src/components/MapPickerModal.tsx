import { useEffect, useMemo, useRef, useState } from 'react'
import type { LatLng, PlaceCandidate } from '../types'

interface MapPickerModalProps {
  open: boolean
  initialLocation?: LatLng
  kakaoReady: boolean
  onClose: () => void
  onSelect: (value: { latlng: LatLng; address?: string }) => void
  reverseGeocode: (loc: LatLng) => Promise<string | undefined>
  keywordSearch: (keyword: string) => Promise<PlaceCandidate[]>
}

const DEFAULT_CENTER: LatLng = { lat: 37.5665, lng: 126.978 }

export function MapPickerModal({
  open,
  kakaoReady,
  initialLocation,
  onClose,
  onSelect,
  reverseGeocode,
  keywordSearch,
}: MapPickerModalProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const [keyword, setKeyword] = useState('')
  const [selected, setSelected] = useState<LatLng | null>(null)
  const [address, setAddress] = useState<string>()
  const [searching, setSearching] = useState(false)
  const [message, setMessage] = useState<string>()

  const center = useMemo(() => initialLocation ?? selected ?? DEFAULT_CENTER, [initialLocation, selected])

  useEffect(() => {
    if (!open) {
      return
    }
    setSelected(initialLocation ?? null)
    setAddress(undefined)
    setMessage(undefined)
    setKeyword('')
  }, [open, initialLocation])

  useEffect(() => {
    if (!open || !kakaoReady || !containerRef.current) {
      return
    }

    const kakao = (window as any).kakao
    const latLng = new kakao.maps.LatLng(center.lat, center.lng)
    const map = new kakao.maps.Map(containerRef.current, {
      center: latLng,
      level: 4,
    })
    mapRef.current = map

    const marker = new kakao.maps.Marker({
      position: latLng,
    })
    marker.setMap(map)
    markerRef.current = marker

    const clickHandler = (mouseEvent: any) => {
      const nextLatLng = mouseEvent.latLng
      const coords = { lat: nextLatLng.getLat(), lng: nextLatLng.getLng() }
      marker.setPosition(nextLatLng)
      map.panTo(nextLatLng)
      setSelected(coords)
      setMessage(undefined)
      void reverseGeocode(coords).then((addr) => {
        setAddress(addr)
      })
    }

    kakao.maps.event.addListener(map, 'click', clickHandler)

    if (initialLocation) {
      void reverseGeocode(initialLocation).then((addr) => {
        setAddress(addr)
      })
    }

    return () => {
      kakao.maps.event.removeListener(map, 'click', clickHandler)
    }
  }, [center.lat, center.lng, initialLocation, kakaoReady, open, reverseGeocode])

  useEffect(() => {
    if (!open || !kakaoReady || !mapRef.current || !markerRef.current) {
      return
    }
    const kakao = (window as any).kakao
    const latLng = new kakao.maps.LatLng(center.lat, center.lng)
    mapRef.current.setCenter(latLng)
    markerRef.current.setPosition(latLng)
  }, [center.lat, center.lng, kakaoReady, open])

  const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!keyword.trim()) {
      return
    }
    setSearching(true)
    setMessage(undefined)
    try {
      const results = await keywordSearch(keyword.trim())
      if (results.length === 0) {
        setMessage('검색 결과가 없습니다.')
        return
      }
      const first = results[0]
      const kakao = (window as any).kakao
      const latLng = new kakao.maps.LatLng(first.latlng.lat, first.latlng.lng)
      if (mapRef.current) {
        mapRef.current.setCenter(latLng)
      }
      if (markerRef.current) {
        markerRef.current.setPosition(latLng)
      }
      setSelected(first.latlng)
      setAddress(first.address)
    } catch (error) {
      setMessage('검색 중 오류가 발생했습니다.')
    } finally {
      setSearching(false)
    }
  }

  const handleConfirm = () => {
    if (!selected) {
      setMessage('지도를 클릭해 위치를 선택하세요.')
      return
    }
    onSelect({ latlng: selected, address })
    onClose()
  }

  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur">
      <div className="flex h-[80vh] w-full max-w-4xl flex-col gap-4 rounded-2xl border border-white/10 bg-slate-950/90 p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">지도에서 위치 선택</h2>
            <p className="text-sm text-slate-400">검색하거나 지도를 클릭해 좌표를 지정하세요.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300 transition hover:border-slate-400/50 hover:text-white"
          >
            닫기
          </button>
        </div>
        {!kakaoReady ? (
          <div className="flex flex-1 items-center justify-center text-sm text-slate-300">카카오맵 SDK를 불러오는 중입니다...</div>
        ) : (
          <>
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                className="input-field"
                placeholder="장소 또는 주소 검색"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
              />
              <button
                type="submit"
                className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-amber-500/30 transition hover:bg-amber-300"
                disabled={searching}
              >
                {searching ? '검색 중...' : '검색'}
              </button>
            </form>
            <div ref={containerRef} className="flex-1 rounded-xl border border-white/10 bg-slate-900/80" />
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
              <p className="font-semibold text-white">선택 좌표</p>
              <p className="mt-1 text-xs text-slate-400">
                {selected ? `${selected.lat.toFixed(6)}, ${selected.lng.toFixed(6)}` : '미선택'}
              </p>
              <p className="mt-2 text-xs text-slate-400">
                주소: {address ?? (selected ? '불러오는 중...' : '미선택')}
              </p>
            </div>
            {message ? <p className="text-xs text-red-300">{message}</p> : null}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-400/40 hover:text-white"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-amber-500/30 transition hover:bg-amber-300"
              >
                이 위치 선택
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
