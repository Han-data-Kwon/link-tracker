import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import useAuthStore from '../store/authStore'

export function useAuth() {
  const { user, profile, loading, setUser, setProfile, setLoading, reset } = useAuthStore()

  useEffect(() => {
    // onAuthStateChange가 구독 즉시 INITIAL_SESSION을 발생시키므로
    // getSession() 중복 호출 없이 여기서만 세션 복원 처리
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user)
          await fetchProfile(session.user.id)
        } else {
          reset()
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      setProfile(data)
    } finally {
      setLoading(false)
    }
  }

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    })
    if (error) throw error
  }

  async function signOut() {
    await supabase.auth.signOut()
    reset()
  }

  return { user, profile, loading, signInWithGoogle, signOut }
}
