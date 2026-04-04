import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { supabase } from './lib/supabase'
import useAuthStore from './store/authStore'
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/auth/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import LinksPage from './pages/LinksPage'
import CreateLinkPage from './pages/CreateLinkPage'
import RedirectPage from './pages/RedirectPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
})

async function resolveSession(user) {
  const { setUser, setProfile, setReady } = useAuthStore.getState()
  setUser(user)
  try {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    setProfile(data)
  } catch (_) {
    // 프로필 조회 실패해도 세션은 유효하므로 ready 처리
  } finally {
    setReady(true)
  }
}

export default function App() {
  useEffect(() => {
    const { setReady, reset } = useAuthStore.getState()

    // 1) 즉시 현재 세션 확인 (가장 확실한 초기화 경로)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        resolveSession(session.user)
      } else {
        reset() // ready: true, user: null → ProtectedRoute가 /login으로 이동
      }
    })

    // 2) 이후 로그인/로그아웃 상태 변화만 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          resolveSession(session.user)
        } else if (event === 'SIGNED_OUT') {
          reset()
        }
        // INITIAL_SESSION은 getSession()에서 이미 처리하므로 무시
      }
    )

    // 3) 3초 타임아웃: 어떤 이유로든 ready가 안 됐으면 강제로 ready 처리
    const timeout = setTimeout(() => {
      if (!useAuthStore.getState().ready) {
        reset()
      }
    }, 3000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* 퍼블릭 */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/r/:slug" element={<RedirectPage />} />

          {/* 보호된 라우트 */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/links"     element={<LinksPage />} />
                    <Route path="/create"    element={<CreateLinkPage />} />
                    <Route path="*"          element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
