import { useState, useEffect, useRef } from 'react'
import { format, subDays } from 'date-fns'
import { useQueryClient } from '@tanstack/react-query'
import StatsCard from '../components/dashboard/StatsCard'
import ClickChart from '../components/dashboard/ClickChart'
import LinkClickChart from '../components/dashboard/LinkClickChart'
import HourlyChart from '../components/dashboard/HourlyChart'
import TagBreakdown from '../components/dashboard/TagBreakdown'
import TopLinks from '../components/dashboard/TopLinks'
import SourceBreakdown from '../components/dashboard/SourceBreakdown'
import RadarSection from '../components/dashboard/RadarSection'
import Button from '../components/ui/Button'
import { useSummaryStats, useActiveLinks } from '../hooks/useAnalytics'
import { supabase } from '../lib/supabase'
import { downloadCsv } from '../lib/csv'

const DAY_OPTIONS = [7, 14, 30, 90]

function LinkFilterDropdown({ links, selectedIds, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function toggleAll() {
    onChange([])
  }

  function toggleLink(id) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(x => x !== id))
    } else {
      onChange([...selectedIds, id])
    }
  }

  const label = selectedIds.length === 0
    ? '전체 링크'
    : `${selectedIds.length}개 선택됨`

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:border-gray-400 transition-colors font-medium text-gray-700"
      >
        <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
        </svg>
        {label}
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-lg w-64 max-h-72 overflow-y-auto">
          {/* 전체 선택 */}
          <label className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-100">
            <input
              type="checkbox"
              checked={selectedIds.length === 0}
              onChange={toggleAll}
              className="rounded border-gray-300 text-indigo-600"
            />
            <span className="text-sm font-medium text-gray-800">전체</span>
          </label>
          {links.map(link => (
            <label key={link.id} className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedIds.includes(link.id)}
                onChange={() => toggleLink(link.id)}
                className="rounded border-gray-300 text-indigo-600"
              />
              <span className="text-sm text-gray-700 truncate">{link.title || link.slug}</span>
            </label>
          ))}
          {links.length === 0 && (
            <p className="text-center py-4 text-sm text-gray-400">링크가 없습니다</p>
          )}
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const [days, setDays] = useState(7)
  const [selectedLinkIds, setSelectedLinkIds] = useState([])
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const queryClient = useQueryClient()
  const { data: summary, isLoading } = useSummaryStats({ linkIds: selectedLinkIds })
  const { data: activeLinks = [] } = useActiveLinks()

  useEffect(() => {
    const timer = setInterval(() => {
      queryClient.invalidateQueries()
      setLastUpdated(new Date())
    }, 30000)
    return () => clearInterval(timer)
  }, [queryClient])

  async function handleDownload() {
    const since = format(subDays(new Date(), days), 'yyyy-MM-dd')
    let query = supabase
      .from('link_daily_stats')
      .select('title, slug, click_date, utm_source, utm_medium, utm_campaign, total_impressions, unique_clicks')
      .eq('is_active', true)
      .gte('click_date', since)
      .order('click_date', { ascending: true })
      .order('title', { ascending: true })

    if (selectedLinkIds.length > 0) query = query.in('link_id', selectedLinkIds)

    const { data, error } = await query
    if (error) { console.error(error); return }

    const rows = (data ?? []).map(r => ({
      '링크명':        r.title || r.slug || '',
      '날짜':          r.click_date || '',
      'utm_source':    r.utm_source  || '',
      'utm_medium':    r.utm_medium  || '',
      'utm_campaign':  r.utm_campaign || '',
      'Impression':    r.total_impressions || 0,
      'Unique':        r.unique_clicks     || 0,
    }))

    downloadCsv(rows, `dashboard_stats_${format(new Date(), 'yyyy-MM-dd')}.csv`)
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
        <div className="flex items-center gap-3 flex-wrap">
          {/* 링크 필터 드롭다운 */}
          <LinkFilterDropdown
            links={activeLinks}
            selectedIds={selectedLinkIds}
            onChange={setSelectedLinkIds}
          />

          {/* 기간 선택 */}
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
      <ClickChart days={days} linkIds={selectedLinkIds} />

      {/* 링크별 일별 클릭 추이 */}
      <LinkClickChart days={days} linkIds={selectedLinkIds} />

      {/* 시간대별 클릭 차트 */}
      <HourlyChart linkIds={selectedLinkIds} />

      {/* 하단 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TopLinks linkIds={selectedLinkIds} days={days} />
        </div>
        <div className="space-y-6">
          <SourceBreakdown linkIds={selectedLinkIds} />
          <TagBreakdown linkIds={selectedLinkIds} />
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
