import { useEffect, useRef } from 'react'
import type { LatLng, Participant } from '../types'

type RecommendationMapPreviewProps = {
  center: LatLng
  participants: Participant[]
  kakaoReady: boolean
}

type OverlayGroup = {
  markers: any[]
  lines: any[]
  overlays: any[]
}

const createLabelContent = (text: string, tone: 'center' | 'participant') => {
  const background = tone === 'center' ? '#fbbf24' : '#0f172a'
  const color = tone === 'center' ? '#0f172a' : '#e2e8f0'
  const border = tone === 'center' ? '#f59e0b' : '#1e293b'
  return `
    <div style="
      padding:4px 10px;
      border-radius:999px;
      background:${background};
      color:${color};
      border:1px solid ${border};
      font-size:12px;
      font-weight:600;
      box-shadow:0 10px 30px rgba(15,23,42,0.35);
      white-space:nowrap;
    ">
      ${text.replace(/"/g, '&quot;')}
    </div>
  `
}

export function RecommendationMapPreview({ center, participants, kakaoReady }: RecommendationMapPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const overlaysRef = useRef<OverlayGroup>({ markers: [], lines: [], overlays: [] })

  useEffect(() => {
    if (!kakaoReady || !containerRef.current || typeof window === 'undefined') {
      return
    }

    const { kakao } = window as any
    if (!kakao?.maps) {
      return
    }

    const initialCenter = new kakao.maps.LatLng(center.lat, center.lng)
    const map = new kakao.maps.Map(containerRef.current, {
      center: initialCenter,
      level: 5,
    })
    mapRef.current = map

    return () => {
      overlaysRef.current.markers.forEach((marker) => marker.setMap(null))
      overlaysRef.current.lines.forEach((line) => line.setMap(null))
      overlaysRef.current.overlays.forEach((overlay) => overlay.setMap(null))
      overlaysRef.current = { markers: [], lines: [], overlays: [] }
      mapRef.current = undefined
    }
  }, [kakaoReady, center.lat, center.lng])

  useEffect(() => {
    if (!kakaoReady || typeof window === 'undefined') {
      return
    }
    const { kakao } = window as any
    if (!kakao?.maps || !mapRef.current) {
      return
    }

    const map = mapRef.current

    overlaysRef.current.markers.forEach((marker) => marker.setMap(null))
    overlaysRef.current.lines.forEach((line) => line.setMap(null))
    overlaysRef.current.overlays.forEach((overlay) => overlay.setMap(null))
    overlaysRef.current = { markers: [], lines: [], overlays: [] }

    const centerLatLng = new kakao.maps.LatLng(center.lat, center.lng)
    const centerMarker = new kakao.maps.Marker({
      position: centerLatLng,
      zIndex: 20,
    })
    centerMarker.setMap(map)
    overlaysRef.current.markers.push(centerMarker)

    const centerOverlay = new kakao.maps.CustomOverlay({
      position: centerLatLng,
      content: createLabelContent('추천 지점', 'center'),
      yAnchor: 1.8,
    })
    centerOverlay.setMap(map)
    overlaysRef.current.overlays.push(centerOverlay)

    const bounds = new kakao.maps.LatLngBounds()
    bounds.extend(centerLatLng)

    participants.forEach((participant, index) => {
      const name = participant.name?.trim().length ? participant.name.trim() : `참여자 ${index + 1}`
      const latLng = new kakao.maps.LatLng(participant.loc.lat, participant.loc.lng)
      bounds.extend(latLng)

      const marker = new kakao.maps.Marker({
        position: latLng,
        zIndex: 10,
      })
      marker.setMap(map)
      overlaysRef.current.markers.push(marker)

      const label = new kakao.maps.CustomOverlay({
        position: latLng,
        content: createLabelContent(name, 'participant'),
        yAnchor: 1.8,
      })
      label.setMap(map)
      overlaysRef.current.overlays.push(label)

      const polyline = new kakao.maps.Polyline({
        path: [latLng, centerLatLng],
        strokeWeight: 3,
        strokeColor: '#fbbf24',
        strokeOpacity: 0.8,
        strokeStyle: 'solid',
      })
      polyline.setMap(map)
      overlaysRef.current.lines.push(polyline)
    })

    if (typeof map.relayout === 'function') {
      map.relayout()
    }

    if (!bounds.isEmpty()) {
      map.setBounds(bounds, 40, 40, 40, 40)
    } else {
      map.setCenter(centerLatLng)
    }
  }, [center.lat, center.lng, kakaoReady, participants])

  return (
    <div className="mt-4 flex flex-col gap-3">
      <p className="text-xs text-slate-400">
        추천 지점(노란색)과 각 참여자의 좌표를 표시하고, 추천 지점까지의 동선을 선으로 연결했어요.
      </p>
      <div
        ref={containerRef}
        className="z-0 h-80 w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-inner shadow-black/30"
      />
    </div>
  )
}
