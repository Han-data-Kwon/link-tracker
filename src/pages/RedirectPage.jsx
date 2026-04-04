import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getVisitorId } from '../lib/fingerprint'
import Spinner from '../components/ui/Spinner'

export default function RedirectPage() {
  const { slug } = useParams()
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!slug) { setError('잘못된 링크입니다'); return }
    redirect()
  }, [slug])

  async function redirect() {
    try {
      // 1. 슬러그로 링크 조회
      const { data: link, error: fetchError } = await supabase
        .rpc('get_link_by_slug', { p_slug: slug })
        .single()

      if (fetchError || !link) { setError('링크를 찾을 수 없습니다'); return }
      if (!link.is_active)     { setError('비활성화된 링크입니다'); return }
      if (link.expires_at && new Date(link.expires_at) < new Date()) {
        setError('만료된 링크입니다'); return
      }

      // 2. 클릭 이벤트 기록 (비동기, 결과 무시하고 바로 리다이렉트)
      recordClick(link.id)

      // 3. 리다이렉트
      window.location.replace(link.full_url)
    } catch {
      setError('오류가 발생했습니다')
    }
  }

  async function recordClick(linkId) {
    try {
      const visitorId = getVisitorId()
      const ua = navigator.userAgent

      let deviceType = 'desktop'
      if (/Mobi|Android/i.test(ua)) deviceType = 'mobile'
      else if (/Tablet|iPad/i.test(ua)) deviceType = 'tablet'

      await supabase.from('clicks').insert({
        link_id:     linkId,
        visitor_id:  visitorId,
        user_agent:  ua.slice(0, 500),
        referer:     document.referrer?.slice(0, 500) || null,
        device_type: deviceType,
      })
    } catch {
      // 클릭 기록 실패는 무시 (리다이렉트 이미 완료)
    }
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-2xl mb-2">🔗</p>
          <h2 className="text-lg font-semibold text-gray-900">{error}</h2>
          <a href="/" className="text-primary-600 hover:underline text-sm mt-2 inline-block">
            홈으로 돌아가기
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-3">
      <Spinner size="lg" />
      <p className="text-sm text-gray-500">이동 중...</p>
    </div>
  )
}
