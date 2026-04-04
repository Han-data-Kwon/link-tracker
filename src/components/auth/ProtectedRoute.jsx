import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { isEmailAllowed } from '../../constants/allowedEmails'
import Spinner from '../ui/Spinner'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  if (!isEmailAllowed(user.email)) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">접근 권한 없음</h2>
          <p className="text-gray-500 mb-4">
            {user.email} 계정은 허용되지 않습니다.<br />
            관리자에게 문의해 주세요.
          </p>
          <button
            onClick={() => useAuth().signOut()}
            className="text-primary-600 hover:underline text-sm"
          >
            다른 계정으로 로그인
          </button>
        </div>
      </div>
    )
  }

  return children
}
