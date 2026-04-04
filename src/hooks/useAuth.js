import { supabase } from '../lib/supabase'
import useAuthStore from '../store/authStore'

// 구독은 App.jsx에서 useAuthInit()으로 딱 한 번만 초기화합니다.
// useAuth()는 스토어에서 상태를 읽고 액션만 제공합니다.
export function useAuth() {
  const { user, profile, loading } = useAuthStore()

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
    useAuthStore.getState().reset()
  }

  return { user, profile, loading, signInWithGoogle, signOut }
}
