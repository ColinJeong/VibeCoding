import { useEffect, useState } from 'react'
import { fetchWeather, loadWeatherCache, saveWeatherCache, type WeatherBundle } from '../services/weather'

export function WeatherCard({ lat, lng }: { lat: number; lng: number }) {
  const [wx, setWx] = useState<WeatherBundle | null>(null)
  const [loading, setLoading] = useState(true)
  const apiKey = import.meta.env.VITE_WEATHER_API_KEY as string | undefined

  useEffect(() => {
    const cached = loadWeatherCache(lat, lng)
    if (cached) {
      setWx(cached)
      setLoading(false)
    }
    let aborted = false
    const run = async () => {
      try {
        const data = await fetchWeather(lat, lng, apiKey)
        if (aborted) return
        setWx(data)
        saveWeatherCache(lat, lng, data)
      } catch {
      } finally {
        if (!aborted) setLoading(false)
      }
    }
    void run()
    return () => {
      aborted = true
    }
  }, [lat, lng, apiKey])

  return (
    <div className="card-surface">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">날씨</h3>
        <span className="text-xs text-slate-400">현재 · +6시간</span>
      </div>
      {loading ? (
        <div className="mt-3 animate-pulse space-y-3">
          <div className="h-4 w-24 rounded bg-white/10" />
          <div className="flex gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-14 w-12 rounded bg-white/5" />
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-3">
          <div className="text-sm text-slate-200">
            현재: {wx?.now?.temp ?? '—'}°C{wx?.now?.feelsLike != null ? ` (체감 ${wx.now.feelsLike}°)` : ''} {wx?.now?.description ?? ''}
          </div>
          <div className="mt-2 flex gap-2">
            {wx?.next6h?.length ? (
              wx.next6h.map((h, idx) => (
                <div key={idx} className="w-16 rounded-lg border border-white/10 bg-white/[0.03] p-2 text-center">
                  <div className="text-xs text-slate-400">+{idx}h</div>
                  <div className="text-sm text-slate-100">{h.temp ?? '—'}°</div>
                  <div className="text-[10px] text-slate-400">POP {h.pop ?? '—'}%</div>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-400">—</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
