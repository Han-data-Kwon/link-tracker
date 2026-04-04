import { useAuth } from '../../hooks/useAuth'
import Button from '../ui/Button'

export default function Header() {
  const { user, profile, signOut } = useAuth()

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-end px-6 gap-4">
      {user && (
        <div className="flex items-center gap-3">
          {user.user_metadata?.avatar_url && (
            <img
              src={user.user_metadata.avatar_url}
              alt="avatar"
              className="w-8 h-8 rounded-full border border-gray-200"
            />
          )}
          <span className="text-sm text-gray-700 hidden sm:block">
            {user.user_metadata?.full_name || user.email}
          </span>
          <Button variant="secondary" size="sm" onClick={signOut}>
            로그아웃
          </Button>
        </div>
      )}
    </header>
  )
}
