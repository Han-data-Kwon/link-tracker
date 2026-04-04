import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { subDays, format } from 'date-fns'

export function useHourlyStats() {
  return useQuery({
    queryKey: ['hourly-stats'],
    queryFn: async () => {
      const now = new Date()
      // 현재 시각을 정각으로 내림 (date-fns는 브라우저 로컬 TZ = KST 사용)
      const nowHour = new Date(now)
      nowHour.setMinutes(0, 0, 0)

      // 24개 슬롯: (nowHour - 23h) ~ nowHour (현재 시간대 포함)
      const slots = {}
      for (let i = 23; i >= 0; i--) {
        const slotTime = new Date(nowHour.getTime() - i * 60 * 60 * 1000)
        const key = format(slotTime, 'yyyy-MM-dd HH')
        slots[key] = { hour: format(slotTime, 'HH:00'), clicks: 0 }
      }

      // 쿼리 범위: 가장 오래된 슬롯 시작부터 현재까지
      const since = new Date(nowHour.getTime() - 23 * 60 * 60 * 1000)

      const { data, error } = await supabase
        .from('clicks')
        .select('clicked_at')
        .gte('clicked_at', since.toISOString())

      if (error) throw error

      // clicked_at은 UTC ISO 문자열 → new Date()로 파싱 시 KST 로컬 TZ로 format됨
      for (const row of data ?? []) {
        const key = format(new Date(row.clicked_at), 'yyyy-MM-dd HH')
        if (slots[key]) slots[key].clicks++
      }

      return Object.values(slots)
    },
  })
}

export function useDailyStats({ linkId, days = 30 } = {}) {
  return useQuery({
    queryKey: ['daily-stats', linkId, days],
    queryFn: async () => {
      const since = format(subDays(new Date(), days), 'yyyy-MM-dd')
      let query = supabase
        .from('link_daily_stats')
        .select('click_date, total_impressions, unique_clicks, utm_source, utm_medium, utm_campaign')
        .eq('is_active', true)
        .gte('click_date', since)
        .order('click_date', { ascending: true })

      if (linkId) query = query.eq('link_id', linkId)

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

export function useSummaryStats() {
  return useQuery({
    queryKey: ['summary-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('link_total_stats')
        .select('total_impressions, unique_clicks, created_at')
        .eq('is_active', true)
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

export function useTagStats() {
  return useQuery({
    queryKey: ['tag-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tag_stats')
        .select('*')
        .order('total_impressions', { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })
}

export function useTopLinks(limit = 10) {
  return useQuery({
    queryKey: ['top-links', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('link_total_stats')
        .select('*')
        .eq('is_active', true)
        .order('total_impressions', { ascending: false })
        .limit(limit)
      if (error) throw error
      return data ?? []
    },
  })
}

export function useSourceBreakdown() {
  return useQuery({
    queryKey: ['source-breakdown'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('link_daily_stats')
        .select('utm_source, total_impressions, unique_clicks')
        .eq('is_active', true)
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
