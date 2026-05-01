import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { generateSlug } from '../lib/slug'
import { buildUtmUrl } from '../lib/utm'
import useAuthStore from '../store/authStore'

export function useLinks(filters = {}) {
  return useQuery({
    queryKey: ['links', filters],
    queryFn: async () => {
      let query = supabase
        .from('link_total_stats')
        .select('*')
        .order('created_at', { ascending: false })

      if (filters.search) {
        query = query.or(
          `title.ilike.%${filters.search}%,slug.ilike.%${filters.search}%,utm_campaign.ilike.%${filters.search}%`
        )
      }
      if (filters.utm_source) query = query.eq('utm_source', filters.source)
      if (filters.utm_campaign) query = query.eq('utm_campaign', filters.campaign)

      const { data, error } = await query
      if (error) throw error
      return data ?? []
    },
  })
}

export function useCreateLink() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async ({ destinationUrl, title, utm, slug, tagIds = [] }) => {
      const finalSlug = slug || generateSlug()
      const fullUrl = buildUtmUrl(destinationUrl, utm)

      const { data: link, error } = await supabase
        .from('links')
        .insert({
          slug: finalSlug,
          title,
          destination_url: destinationUrl,
          full_url: fullUrl,
          utm_source:   utm.source   || null,
          utm_medium:   utm.medium   || null,
          utm_campaign: utm.campaign || null,
          utm_term:     utm.term     || null,
          utm_content:  utm.content  || null,
          user_id: user?.id,
        })
        .select()
        .single()

      if (error) throw error

      // 태그 연결
      if (tagIds.length > 0) {
        const { error: tagError } = await supabase
          .from('link_tags')
          .insert(tagIds.map(tag_id => ({ link_id: link.id, tag_id })))
        if (tagError) throw tagError
      }

      return link
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links'] })
    },
  })
}

export function useBulkCreateLinks() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async (linkRows) => {
      const rows = linkRows.map(row => ({
        slug:            row.slug,
        title:           row.title || null,
        destination_url: row.destination_url,
        full_url:        row.full_url,
        utm_source:      row.utm_source   || null,
        utm_medium:      row.utm_medium   || null,
        utm_campaign:    row.utm_campaign || null,
        utm_term:        row.utm_term     || null,
        utm_content:     row.utm_content  || null,
        user_id:         user?.id,
      }))

      const { data, error } = await supabase
        .from('links')
        .insert(rows)
        .select()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links'] })
    },
  })
}

export function useUpdateLink() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, destinationUrl, title, slug, utm, tagIds = [] }) => {
      const fullUrl = buildUtmUrl(destinationUrl, utm)

      const { data: updated, error } = await supabase
        .from('links')
        .update({
          title,
          slug,
          destination_url: destinationUrl,
          full_url: fullUrl,
          utm_source:   utm.source   || null,
          utm_medium:   utm.medium   || null,
          utm_campaign: utm.campaign || null,
          utm_term:     utm.term     || null,
          utm_content:  utm.content  || null,
        })
        .eq('id', id)
        .select('id')
      if (error) throw error
      if (!updated || updated.length === 0) throw new Error('수정 권한이 없거나 링크를 찾을 수 없습니다')

      const { error: delErr } = await supabase.from('link_tags').delete().eq('link_id', id)
      if (delErr) throw delErr

      if (tagIds.length > 0) {
        const { error: tagErr } = await supabase
          .from('link_tags')
          .insert(tagIds.map(tag_id => ({ link_id: id, tag_id })))
        if (tagErr) throw tagErr
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links'] })
      queryClient.invalidateQueries({ queryKey: ['active-links'] })
      queryClient.invalidateQueries({ queryKey: ['top-links'] })
      queryClient.invalidateQueries({ queryKey: ['tag-stats'] })
      queryClient.invalidateQueries({ queryKey: ['source-breakdown'] })
      queryClient.invalidateQueries({ queryKey: ['link-tags'] })
    },
  })
}

export function useDeleteLink() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      const { data: deleted, error } = await supabase
        .from('links')
        .delete()
        .eq('id', id)
        .select('id')
      if (error) throw error
      if (!deleted || deleted.length === 0) throw new Error('삭제 권한이 없거나 링크를 찾을 수 없습니다')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links'] })
      queryClient.invalidateQueries({ queryKey: ['active-links'] })
      queryClient.invalidateQueries({ queryKey: ['daily-stats'] })
      queryClient.invalidateQueries({ queryKey: ['summary-stats'] })
      queryClient.invalidateQueries({ queryKey: ['top-links'] })
      queryClient.invalidateQueries({ queryKey: ['source-breakdown'] })
      queryClient.invalidateQueries({ queryKey: ['tag-stats'] })
      queryClient.invalidateQueries({ queryKey: ['alerts-all'] })
      queryClient.invalidateQueries({ queryKey: ['alert-logs'] })
    },
  })
}

export function useToggleLinkActive() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, is_active }) => {
      const { data: updated, error } = await supabase
        .from('links')
        .update({ is_active })
        .eq('id', id)
        .select('id')
      if (error) throw error
      if (!updated || updated.length === 0) throw new Error('수정 권한이 없거나 링크를 찾을 수 없습니다')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links'] })
      queryClient.invalidateQueries({ queryKey: ['active-links'] })
      queryClient.invalidateQueries({ queryKey: ['hourly-stats'] })
      queryClient.invalidateQueries({ queryKey: ['daily-stats'] })
      queryClient.invalidateQueries({ queryKey: ['summary-stats'] })
      queryClient.invalidateQueries({ queryKey: ['top-links'] })
      queryClient.invalidateQueries({ queryKey: ['source-breakdown'] })
      queryClient.invalidateQueries({ queryKey: ['tag-stats'] })
      queryClient.invalidateQueries({ queryKey: ['alerts-all'] })
      queryClient.invalidateQueries({ queryKey: ['alert-logs'] })
    },
  })
}
