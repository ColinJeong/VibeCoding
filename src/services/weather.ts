export type WeatherNow = {
  temp?: number
  feelsLike?: number
  description?: string
  icon?: string
  windKph?: number
  pop?: number | null
}

export type WeatherHourly = { ts: number; temp?: number; pop?: number | null; icon?: string }[]

export type WeatherBundle = { now: WeatherNow; next6h: WeatherHourly }

const TTL_MS = 10 * 60 * 1000

function cacheKey(lat: number, lng: number) {
  return `wx:${lat.toFixed(3)}:${lng.toFixed(3)}`
}

export function loadWeatherCache(lat: number, lng: number): WeatherBundle | null {
  try {
    const raw = localStorage.getItem(cacheKey(lat, lng))
    if (!raw) return null
    const parsed = JSON.parse(raw) as { at: number; data: WeatherBundle }
    if (Date.now() - parsed.at > TTL_MS) return null
    return parsed.data
  } catch {
    return null
  }
}

export function saveWeatherCache(lat: number, lng: number, data: WeatherBundle) {
  try {
    localStorage.setItem(cacheKey(lat, lng), JSON.stringify({ at: Date.now(), data }))
  } catch {}
}

async function fetchOneCall(version: '3.0' | '2.5', lat: number, lng: number, apiKey: string) {
  const base = version === '3.0' ? 'https://api.openweathermap.org/data/3.0/onecall' : 'https://api.openweathermap.org/data/2.5/onecall'
  const url = new URL(base)
  url.searchParams.set('lat', String(lat))
  url.searchParams.set('lon', String(lng))
  url.searchParams.set('exclude', 'minutely,daily,alerts')
  url.searchParams.set('units', 'metric')
  url.searchParams.set('lang', 'kr')
  url.searchParams.set('appid', apiKey)
  const res = await fetch(url.toString())
  return { ok: res.ok, status: res.status, data: res.ok ? await res.json() : null }
}

export async function fetchWeather(lat: number, lng: number, apiKey?: string): Promise<WeatherBundle> {
  if (!apiKey) throw new Error('Missing VITE_WEATHER_API_KEY')
  let resp = await fetchOneCall('3.0', lat, lng, apiKey)
  if (!resp.ok) {
    // eslint-disable-next-line no-console
    console.warn?.(`[weather] OneCall 3.0 failed (status=${resp.status}); falling back to 2.5`)
    resp = await fetchOneCall('2.5', lat, lng, apiKey)
  }
  if (!resp.ok || !resp.data) throw new Error(`Weather status ${resp.status}`)
  const data = resp.data

  const now: WeatherNow = {
    temp: typeof data.current?.temp === 'number' ? Math.round(data.current.temp) : undefined,
    feelsLike: typeof data.current?.feels_like === 'number' ? Math.round(data.current.feels_like) : undefined,
    description: data.current?.weather?.[0]?.description,
    icon: data.current?.weather?.[0]?.icon,
    windKph: typeof data.current?.wind_speed === 'number' ? Math.round(data.current.wind_speed * 3.6) : undefined,
    pop: null,
  }
  const next6h: WeatherHourly = Array.isArray(data.hourly)
    ? (data.hourly as any[]).slice(0, 6).map((h) => ({
        ts: h.dt,
        temp: typeof h.temp === 'number' ? Math.round(h.temp) : undefined,
        pop: typeof h.pop === 'number' ? Math.round(h.pop * 100) : null,
        icon: h.weather?.[0]?.icon,
      }))
    : []

  return { now, next6h }
}


