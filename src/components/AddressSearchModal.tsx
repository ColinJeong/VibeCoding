import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { LatLng, PlaceCandidate } from '../types'

type AddressSearchModalProps = {
  open: boolean
  kakaoReady: boolean
  onClose: () => void
  onSelect: (place: PlaceCandidate) => void
  keywordSearch: (keyword: string, options?: { size?: number; location?: LatLng; radius?: number }) => Promise<PlaceCandidate[]>
  addressSearch: (query: string) => Promise<PlaceCandidate[]>
  center?: LatLng
  initialQuery?: string
}

const RECENT_KEY = 'recentAddresses'

export function AddressSearchModal({ open, kakaoReady, onClose, onSelect, keywordSearch, addressSearch, center, initialQuery = '' }: AddressSearchModalProps) {
  const [query, setQuery] = useState(initialQuery)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<PlaceCandidate[]>([])
  const [recent, setRecent] = useState<PlaceCandidate[]>([])
  const mapRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const markerRef = useRef<any>(null)
  const rootRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const raw = localStorage.getItem(RECENT_KEY)
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as PlaceCandidate[]
        setRecent(parsed.slice(0, 8))
      } catch {
        setRecent([])
      }
    } else {
      setRecent([])
    }
  }, [open])

  useEffect(() => {
    if (!open || !kakaoReady || !containerRef.current) return
    const { kakao } = window as any
    const initial = new kakao.maps.LatLng(center?.lat ?? 37.5665, center?.lng ?? 126.978)
    const map = new kakao.maps.Map(containerRef.current, { center: initial, level: 4 })
    mapRef.current = map
    const marker = new kakao.maps.Marker({ position: initial })
    marker.setMap(map)
    markerRef.current = marker
    return () => {
      mapRef.current = null
      markerRef.current = null
    }
  }, [open, kakaoReady, center?.lat, center?.lng])

  const moveMarker = (latlng: LatLng) => {
    if (!kakaoReady || !mapRef.current || !markerRef.current) return
    const { kakao } = window as any
    const pos = new kakao.maps.LatLng(latlng.lat, latlng.lng)
    markerRef.current.setPosition(pos)
    mapRef.current.setCenter(pos)
  }

  const runSearch = async (q: string) => {
    const trimmed = q.trim()
    if (!trimmed) {
      setResults([])
      return
    }
    setLoading(true)
    try {
      const [places, addresses] = await Promise.all([
        keywordSearch(trimmed, center ? { size: 8, location: center, radius: 3000 } : { size: 8 }),
        addressSearch(trimmed),
      ])
      const map = new Map<string, PlaceCandidate>()
      ;[...places, ...addresses].forEach((p) => {
        if (!map.has(p.placeId)) map.set(p.placeId, p)
      })
      const merged = Array.from(map.values())
      setResults(merged)
      if (merged[0]) moveMarker(merged[0].latlng)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!open) return
    setQuery(initialQuery)
    if (initialQuery) void runSearch(initialQuery)
  }, [open, initialQuery])

  const handlePick = (p: PlaceCandidate) => {
    try {
      const raw = localStorage.getItem(RECENT_KEY)
      const arr = raw ? (JSON.parse(raw) as PlaceCandidate[]) : []
      const next = [p, ...arr.filter((x) => x.placeId !== p.placeId)].slice(0, 8)
      localStorage.setItem(RECENT_KEY, JSON.stringify(next))
    } catch {}
    onSelect(p)
    onClose()
  }

  // Focus trap + ESC
  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
      if (e.key === 'Tab') {
        const root = rootRef.current
        if (!root) return
        const nodes = root.querySelectorAll<HTMLElement>('a,button,input,select,textarea,[tabindex]:not([tabindex="-1"])')
        const list = Array.from(nodes).filter((el) => !el.hasAttribute('disabled'))
        if (list.length === 0) return
        const first = list[0]
        const last = list[list.length - 1]
        const active = document.activeElement as HTMLElement | null
        if (e.shiftKey) {
          if (active === first || !root.contains(active)) {
            e.preventDefault()
            last.focus()
          }
        } else {
          if (active === last) {
            e.preventDefault()
            first.focus()
          }
        }
      }
    }
    document.addEventListener('keydown', handleKey, true)
    return () => document.removeEventListener('keydown', handleKey, true)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[9999]">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-0 md:p-6">
        <div ref={rootRef} className="w-[min(960px,92vw)] overflow-hidden rounded-2xl border border-white/10 bg-[#111827] shadow-2xl" role="dialog" aria-modal="true">
          <div className="flex items-center justify-between gap-2 border-b border-white/10 p-3 md:p-4">
            <div className="flex-1">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  void runSearch(query)
                }}
                className="flex gap-2"
              >
                <input
                  className="input-field flex-1"
                  placeholder="장소 또는 주소를 검색"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <button type="submit" className="rounded-xl bg-amber-400 px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-amber-300">
                  검색
                </button>
              </form>
            </div>
            <button type="button" onClick={onClose} className="rounded-md border border-white/10 px-2 py-1 text-xs text-slate-300 hover:border-slate-400/40 hover:text-white">
              닫기
            </button>
          </div>
          <div className="grid h-[calc(100%-3.25rem)] grid-rows-[1fr,auto] md:h-[calc(100%-4rem)]">
            <div className="grid grid-rows-2 gap-3 p-3 md:grid-cols-2 md:grid-rows-1 md:p-4">
              <div className="overflow-auto rounded-xl border border-white/10 bg-white/[0.02] p-2">
                <p className="px-2 text-xs text-slate-400">검색 결과</p>
                {loading ? (
                  <div className="p-3 text-sm text-slate-400">불러오는 중...</div>
                ) : results.length === 0 ? (
                  <div className="p-3 text-sm text-slate-400">검색 결과가 없습니다.</div>
                ) : (
                  <ul>
                    {results.map((r) => (
                      <li key={r.placeId} className="cursor-pointer px-3 py-2 hover:bg-white/5" onClick={() => handlePick(r)}>
                        <p className="text-slate-100">{r.name}</p>
                        <p className="mt-0.5 text-xs text-slate-400">{r.address}</p>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-3 border-t border-white/10 pt-2">
                  <p className="px-2 text-xs text-slate-400">최근 선택</p>
                  {recent.length === 0 ? (
                    <div className="p-3 text-xs text-slate-400">—</div>
                  ) : (
                    <ul>
                      {recent.map((r) => (
                        <li key={`recent-${r.placeId}`} className="cursor-pointer px-3 py-2 hover:bg-white/5" onClick={() => handlePick(r)}>
                          <p className="text-slate-100">{r.name}</p>
                          <p className="mt-0.5 text-xs text-slate-400">{r.address}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-900">
                <div ref={containerRef} className="h-64 w-full md:h-full" />
                {!kakaoReady ? <div className="p-3 text-center text-xs text-slate-400">카카오 지도 SDK를 불러오는 중...</div> : null}
              </div>
            </div>
            <div className="border-t border-white/10 p-2 text-center text-xs text-slate-400 md:p-3">검색 결과를 선택하면 지도 마커가 이동하고 주소가 업데이트됩니다.</div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

