import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { useQueryClient } from '@tanstack/react-query'
import LinkTable from '../components/links/LinkTable'
import Button from '../components/ui/Button'
import { useLinks } from '../hooks/useLinks'
import { downloadCsv } from '../lib/csv'

export default function LinksPage() {
  const navigate = useNavigate()
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const queryClient = useQueryClient()
  const { data: links = [] } = useLinks()

  useEffect(() => {
    const timer = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['links'] })
      setLastUpdated(new Date())
    }, 60000)
    return () => clearInterval(timer)
  }, [queryClient])

  function handleDownload() {
    const rows = links.map(l => ({
      '제목':            l.title || '',
      '슬러그':          l.slug,
      '목적지 URL':      l.destination_url,
      'UTM Source':     l.utm_source   || '',
      'UTM Medium':     l.utm_medium   || '',
      'UTM Campaign':   l.utm_campaign || '',
      'UTM Term':       l.utm_term     || '',
      'UTM Content':    l.utm_content  || '',
      '총 클릭':         l.total_impressions ?? 0,
      '순 방문자':       l.unique_clicks     ?? 0,
      '활성 여부':       l.is_active ? 'Y' : 'N',
      '생성일':          l.created_at ? format(new Date(l.created_at), 'yyyy-MM-dd') : '',
    }))
    downloadCsv(rows, `links_${format(new Date(), 'yyyy-MM-dd')}.csv`)
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">링크 관리</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleDownload}
            disabled={links.length === 0}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            CSV
          </Button>
          <Button onClick={() => navigate('/create')}>
            + 새 링크
          </Button>
        </div>
      </div>
      <LinkTable />

      {/* 마지막 업데이트 */}
      <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm text-xs text-gray-500">
        마지막 업데이트: {format(lastUpdated, 'HH:mm:ss')}
      </div>
    </div>
  )
}
