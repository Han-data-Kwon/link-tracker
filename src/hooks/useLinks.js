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

export function useToggleLinkActive() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, is_active }) => {
      const { error } = await supabase
        .from('links')
        .update({ is_active })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links'] })
    },
  })
}
