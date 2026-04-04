import { create } from 'zustand'

const useAuthStore = create((set) => ({
  user:    null,
  profile: null,
  ready:   false,   // 세션 확인 완료 여부 (loading 대신 ready 사용)
  setUser:    (user)    => set({ user }),
  setProfile: (profile) => set({ profile }),
  setReady:   (ready)   => set({ ready }),
  reset: () => set({ user: null, profile: null, ready: true }),
}))

export default useAuthStore
