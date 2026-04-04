import { supabase } from '../lib/supabase'
import useAuthStore from '../store/authStore'

// 상태 읽기 + 액션만 제공. 구독/초기화는 App.jsx에서 단 1회 처리.
export function useAuth() {
  const { user, profile, ready } = useAuthStore()

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    })
    if (error) throw error
  }

  async function signOut() {
    await supabase.auth.signOut()
    useAuthStore.getState().reset()
  }

  return { user, profile, ready, signInWithGoogle, signOut }
}
