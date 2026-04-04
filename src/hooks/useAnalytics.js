import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { subDays, format } from 'date-fns'

export function useDailyStats({ linkId, days = 30 } = {}) {
  return useQuery({
    queryKey: ['daily-stats', linkId, days],
    queryFn: async () => {
      const since = format(subDays(new Date(), days), 'yyyy-MM-dd')
      let query = supabase
        .from('link_daily_stats')
        .select('click_date, total_impressions, unique_clicks, utm_source, utm_medium, utm_campaign')
        .gte('click_date', since)
        .order('click_date', { ascending: true })

      if (linkId) query = query.eq('link_id', linkId)

      const { data, error } = await query
      if (error) throw error

      // 날짜별 집계
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
