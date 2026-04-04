import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { useQueryClient } from '@tanstack/react-query'
import StatsCard from '../components/dashboard/StatsCard'
import ClickChart from '../components/dashboard/ClickChart'
import HourlyChart from '../components/dashboard/HourlyChart'
import TagBreakdown from '../components/dashboard/TagBreakdown'
import TopLinks from '../components/dashboard/TopLinks'
import SourceBreakdown from '../components/dashboard/SourceBreakdown'
import RadarSection from '../components/dashboard/RadarSection'
import Button from '../components/ui/Button'
import { useSummaryStats, useDailyStats } from '../hooks/useAnalytics'
import { downloadCsv } from '../lib/csv'

const DAY_OPTIONS = [7, 14, 30, 90]

export default function DashboardPage() {
  const [days, setDays] = useState(30)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const queryClient = useQueryClient()
  const { data: summary, isLoading } = useSummaryStats()
  const { data: dailyStats = [] } = useDailyStats({ days })

  useEffect(() => {
    const timer = setInterval(() => {
      queryClient.invalidateQueries()
      setLastUpdated(new Date())
    }, 30000)
    return () => clearInterval(timer)
  }, [queryClient])

  function handleDownload() {
    const rows = dailyStats.map(r => ({
      '날짜':                  r.date,
      '총 클릭(Impression)':   r.impressions,
      '순 방문자(Unique)':     r.unique,
    }))
    downloadCsv(rows, `dashboard_stats_${format(new Date(), 'yyyy-MM-dd')}.csv`)
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            {DAY_OPTIONS.map(d => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
                  days === d
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {d}일
              </button>
            ))}
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleDownload}
            disabled={dailyStats.length === 0}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            CSV
          </Button>
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard
          title="총 링크 수 (활성)"
          value={isLoading ? null : summary?.totalLinks}
          color="primary"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          }
        />
        <StatsCard
          title="전체 클릭 (Impression)"
          value={isLoading ? null : summary?.totalImpressions}
          color="blue"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          }
        />
        <StatsCard
          title="순 방문자 (Unique)"
          value={isLoading ? null : summary?.totalUnique}
          color="green"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
      </div>

      {/* 일별 클릭 차트 */}
      <ClickChart days={days} />

      {/* 시간대별 클릭 차트 */}
      <HourlyChart />

      {/* 하단 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TopLinks />
        </div>
        <div className="space-y-6">
          <SourceBreakdown />
          <TagBreakdown />
        </div>
      </div>

      {/* 캠페인 레이더 */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          캠페인 레이더
        </h2>
        <RadarSection />
      </div>

      {/* 마지막 업데이트 */}
      <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm text-xs text-gray-500">
        마지막 업데이트: {format(lastUpdated, 'HH:mm:ss')}
      </div>
    </div>
  )
}
