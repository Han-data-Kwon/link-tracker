import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import useAuthStore from '../store/authStore'

export function useAlerts(linkId) {
  return useQuery({
    queryKey: ['alerts', linkId],
    enabled: !!linkId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('link_id', linkId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })
}

export function useAllAlerts() {
  return useQuery({
    queryKey: ['alerts-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('alerts')
        .select('*, links(title, slug)')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })
}

export function useRecentAlertLogs(limit = 20) {
  return useQuery({
    queryKey: ['alert-logs', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('alert_logs')
        .select('*, alerts(alert_type, threshold, links(title, slug))')
        .order('triggered_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      return data ?? []
    },
  })
}

export function useCreateAlert() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async ({ linkId, alertType, threshold, recipientEmail }) => {
      const { data, error } = await supabase
        .from('alerts')
        .insert({
          link_id:         linkId,
          user_id:         user?.id,
          alert_type:      alertType,
          threshold:       Number(threshold),
          recipient_email: recipientEmail,
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['alerts', vars.linkId] })
      queryClient.invalidateQueries({ queryKey: ['alerts-all'] })
    },
  })
}

export function useDeleteAlert() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (alertId) => {
      const { error } = await supabase.from('alerts').delete().eq('id', alertId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
      queryClient.invalidateQueries({ queryKey: ['alerts-all'] })
    },
  })
}

export function useToggleAlert() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, is_active }) => {
      const { error } = await supabase.from('alerts').update({ is_active }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
      queryClient.invalidateQueries({ queryKey: ['alerts-all'] })
    },
  })
}
