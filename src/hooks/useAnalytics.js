import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { subDays, format } from 'date-fns'

export function useActiveLinks() {
  return useQuery({
    queryKey: ['active-links'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('link_total_stats')
        .select('link_id, title, slug')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []).map(r => ({ id: r.link_id, title: r.title, slug: r.slug }))
    },
  })
}

export function useHourlyStats({ linkIds = [] } = {}) {
  return useQuery({
    queryKey: ['hourly-stats', linkIds],
    queryFn: async () => {
      const now = new Date()
      const nowHour = new Date(now)
      nowHour.setMinutes(0, 0, 0)

      const slots = {}
      for (let i = 23; i >= 0; i--) {
        const slotTime = new Date(nowHour.getTime() - i * 60 * 60 * 1000)
        const key = format(slotTime, 'yyyy-MM-dd HH')
        slots[key] = { hour: format(slotTime, 'HH:00'), clicks: 0 }
      }

      const since = new Date(nowHour.getTime() - 23 * 60 * 60 * 1000)

      let query = supabase
        .from('clicks')
        .select('clicked_at, links!inner(is_active)')
        .eq('links.is_active', true)
        .gte('clicked_at', since.toISOString())

      if (linkIds.length > 0) query = query.in('link_id', linkIds)

      const { data, error } = await query
      if (error) throw error

      for (const row of data ?? []) {
        const key = format(new Date(row.clicked_at), 'yyyy-MM-dd HH')
        if (slots[key]) slots[key].clicks++
      }

      return Object.values(slots)
    },
  })
}

export function useDailyStats({ linkIds = [], days = 30 } = {}) {
  return useQuery({
    queryKey: ['daily-stats', linkIds, days],
    queryFn: async () => {
      const since = format(subDays(new Date(), days), 'yyyy-MM-dd')
      let query = supabase
        .from('link_daily_stats')
        .select('click_date, total_impressions, unique_clicks, utm_source, utm_medium, utm_campaign')
        .eq('is_active', true)
        .gte('click_date', since)
        .order('click_date', { ascending: true })

      if (linkIds.length > 0) query = query.in('link_id', linkIds)

      const { data, error } = await query
      if (error) throw error

      const byDate = {}
      for (const row of data ?? []) {
        const d = row.click_date
        if (!byDate[d]) byDate[d] = { date: d, impressions: 0, unique: 0 }
        byDate[d].impressions += Number(row.total_impressions) || 0
        byDate[d].unique      += Number(row.unique_clicks)     || 0
      }
      return Object.values(byDate)
    },
  })
}

export function useSummaryStats({ linkIds = [] } = {}) {
  return useQuery({
    queryKey: ['summary-stats', linkIds],
    queryFn: async () => {
      let query = supabase
        .from('link_total_stats')
        .select('total_impressions, unique_clicks, created_at')
        .eq('is_active', true)

      if (linkIds.length > 0) query = query.in('link_id', linkIds)

      const { data, error } = await query
      if (error) throw error

      const total = data ?? []
      return {
        totalLinks:       total.length,
        totalImpressions: total.reduce((s, r) => s + (Number(r.total_impressions) || 0), 0),
        totalUnique:      total.reduce((s, r) => s + (Number(r.unique_clicks)     || 0), 0),
      }
    },
  })
}

export function useTagStats({ linkIds = [] } = {}) {
  return useQuery({
    queryKey: ['tag-stats', linkIds],
    queryFn: async () => {
      if (linkIds.length === 0) {
        const { data, error } = await supabase
          .from('tag_stats')
          .select('*')
          .order('total_impressions', { ascending: false })
        if (error) throw error
        return data ?? []
      }

      // 선택된 링크에 연결된 태그 조회
      const { data: ltData, error: ltErr } = await supabase
        .from('link_tags')
        .select('link_id, tag_id')
        .in('link_id', linkIds)
      if (ltErr) throw ltErr

      const tagIds = [...new Set((ltData ?? []).map(r => r.tag_id))]
      if (tagIds.length === 0) return []

      const [{ data: tagsData, error: tagsErr }, { data: statsData, error: statsErr }] =
        await Promise.all([
          supabase.from('tags').select('id, name, color').in('id', tagIds),
          supabase.from('link_total_stats').select('link_id, total_impressions, unique_clicks').in('link_id', linkIds),
        ])
      if (tagsErr) throw tagsErr
      if (statsErr) throw statsErr

      const statsMap = {}
      for (const s of statsData ?? []) statsMap[s.link_id] = s

      const tagMap = {}
      for (const lt of ltData ?? []) {
        if (!tagMap[lt.tag_id]) {
          const tag = (tagsData ?? []).find(t => t.id === lt.tag_id)
          if (!tag) continue
          tagMap[lt.tag_id] = { tag_id: tag.id, tag_name: tag.name, color: tag.color, link_count: 0, total_impressions: 0, unique_clicks: 0 }
        }
        tagMap[lt.tag_id].link_count++
        const s = statsMap[lt.link_id]
        if (s) {
          tagMap[lt.tag_id].total_impressions += Number(s.total_impressions) || 0
          tagMap[lt.tag_id].unique_clicks     += Number(s.unique_clicks)     || 0
        }
      }

      return Object.values(tagMap).sort((a, b) => b.total_impressions - a.total_impressions)
    },
  })
}

export function useTopLinks({ limit = 10, linkIds = [], days = 30 } = {}) {
  return useQuery({
    queryKey: ['top-links', limit, linkIds, days],
    queryFn: async () => {
      const since = format(subDays(new Date(), days), 'yyyy-MM-dd')
      let query = supabase
        .from('link_daily_stats')
        .select('link_id, title, slug, utm_source, utm_campaign, total_impressions, unique_clicks')
        .eq('is_active', true)
        .gte('click_date', since)

      if (linkIds.length > 0) query = query.in('link_id', linkIds)

      const { data, error } = await query
      if (error) throw error

      const byLink = {}
      for (const row of data ?? []) {
        if (!byLink[row.link_id]) {
          byLink[row.link_id] = {
            link_id: row.link_id,
            title: row.title,
            slug: row.slug,
            utm_source: row.utm_source,
            utm_campaign: row.utm_campaign,
            total_impressions: 0,
            unique_clicks: 0,
          }
        }
        byLink[row.link_id].total_impressions += Number(row.total_impressions) || 0
        byLink[row.link_id].unique_clicks += Number(row.unique_clicks) || 0
      }

      return Object.values(byLink)
        .sort((a, b) => b.total_impressions - a.total_impressions)
        .slice(0, limit)
    },
  })
}

const LINK_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6']
const TOP_N = 5

export function useLinkDailyStats({ days = 7, linkIds = [] } = {}) {
  return useQuery({
    queryKey: ['link-daily-stats', days, linkIds],
    queryFn: async () => {
      const since = format(subDays(new Date(), days), 'yyyy-MM-dd')

      let query = supabase
        .from('link_daily_stats')
        .select('link_id, title, slug, click_date, total_impressions')
        .eq('is_active', true)
        .gte('click_date', since)
        .not('click_date', 'is', null)

      if (linkIds.length > 0) query = query.in('link_id', linkIds)

      const { data, error } = await query
      if (error) throw error

      const rows = data ?? []

      // 링크별 기간 합계
      const linkTotals = {}
      const linkLabels = {}
      for (const row of rows) {
        if (!linkTotals[row.link_id]) {
          linkTotals[row.link_id] = 0
          linkLabels[row.link_id] = row.title || row.slug
        }
        linkTotals[row.link_id] += Number(row.total_impressions) || 0
      }

      const sorted = Object.entries(linkTotals).sort(([, a], [, b]) => b - a)
      const topIds = new Set(sorted.slice(0, TOP_N).map(([id]) => id))
      const hasOthers = sorted.length > TOP_N

      // 날짜 배열 생성 (오름차순)
      const dates = []
      for (let i = days - 1; i >= 0; i--) {
        dates.push(format(subDays(new Date(), i), 'yyyy-MM-dd'))
      }

      // 날짜별 초기화
      const byDate = {}
      const topKeys = sorted.slice(0, TOP_N).map(([id]) => linkLabels[id])
      for (const date of dates) {
        byDate[date] = { date: date.slice(5) }
        for (const key of topKeys) byDate[date][key] = 0
        if (hasOthers) byDate[date]['기타'] = 0
      }

      // 데이터 채우기
      for (const row of rows) {
        if (!byDate[row.click_date]) continue
        const val = Number(row.total_impressions) || 0
        if (topIds.has(row.link_id)) {
          const key = linkLabels[row.link_id]
          byDate[row.click_date][key] = (byDate[row.click_date][key] || 0) + val
        } else if (hasOthers) {
          byDate[row.click_date]['기타'] = (byDate[row.click_date]['기타'] || 0) + val
        }
      }

      const colorMap = {}
      topKeys.forEach((key, i) => { colorMap[key] = LINK_COLORS[i] })
      if (hasOthers) colorMap['기타'] = '#d1d5db'
      const allKeys = hasOthers ? [...topKeys, '기타'] : topKeys

      return { chartData: Object.values(byDate), linkKeys: allKeys, colorMap }
    },
  })
}

export function useSourceBreakdown({ linkIds = [] } = {}) {
  return useQuery({
    queryKey: ['source-breakdown', linkIds],
    queryFn: async () => {
      let query = supabase
        .from('link_daily_stats')
        .select('utm_source, total_impressions, unique_clicks')
        .eq('is_active', true)

      if (linkIds.length > 0) query = query.in('link_id', linkIds)

      const { data, error } = await query
      if (error) throw error

      const bySource = {}
      for (const row of data ?? []) {
        const src = row.utm_source || '(없음)'
        if (!bySource[src]) bySource[src] = { source: src, impressions: 0, unique: 0 }
        bySource[src].impressions += Number(row.total_impressions) || 0
        bySource[src].unique      += Number(row.unique_clicks)     || 0
      }
      return Object.values(bySource).sort((a, b) => b.impressions - a.impressions)
    },
  })
}
