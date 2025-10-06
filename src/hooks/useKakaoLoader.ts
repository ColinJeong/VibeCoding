import { useEffect, useState } from 'react'

type KakaoLoaderState = {
  ready: boolean
  error?: string
}

const KAKAO_SDK_URL = 'https://dapi.kakao.com/v2/maps/sdk.js'

export function useKakaoLoader(appKey?: string) {
  const [state, setState] = useState<KakaoLoaderState>({ ready: false })

  useEffect(() => {
    if (!appKey) {
      setState({ ready: false, error: 'Kakao APP KEY 미설정' })
      return
    }

    if (typeof window === 'undefined') {
      return
    }

    if ((window as any).kakao?.maps) {
      setState({ ready: true })
      return
    }

    const scriptId = 'kakao-maps-sdk'
    const existing = document.getElementById(scriptId) as HTMLScriptElement | null
    const handleLoad = () => {
      if (!(window as any).kakao?.maps) {
        setState({ ready: false, error: 'Kakao SDK 로드 실패' })
        return
      }
      ;(window as any).kakao.maps.load(() => {
        setState({ ready: true })
      })
    }

    if (existing) {
      existing.addEventListener('load', handleLoad)
      return () => existing.removeEventListener('load', handleLoad)
    }

    const script = document.createElement('script')
    script.id = scriptId
    script.async = true
    const params = new URLSearchParams({
      appkey: appKey,
      autoload: 'false',
      libraries: 'services',
    })
    script.src = `${KAKAO_SDK_URL}?${params.toString()}`
    script.addEventListener('load', handleLoad)
    script.addEventListener('error', () => {
      setState({ ready: false, error: 'Kakao SDK 로드 실패' })
    })
    document.body.appendChild(script)

    return () => {
      script.removeEventListener('load', handleLoad)
    }
  }, [appKey])

  return state
}
