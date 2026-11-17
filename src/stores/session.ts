import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { configureHttpAuth } from '@/api/http'
import type { Role } from '@/constants/permissions'

export interface SessionUser {
  id: number
  name: string
  role: Role
  merchantId: number
}

interface SessionState {
  token: string | null
  user: SessionUser | null
  setSession: (session: { token: string; user: SessionUser }) => void
  updateUser: (user: SessionUser) => void
  clear: () => void
}

/**
 * 会话状态：token 仅持久化到 sessionStorage，关闭标签页即失效（BTD §7.2）。
 */
export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setSession: ({ token, user }) => set({ token, user }),
      updateUser: (user) => set({ user }),
      clear: () => set({ token: null, user: null }),
    }),
    {
      name: 'bsm.session',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ token: state.token, user: state.user }),
    },
  ),
)

/** 供非组件代码（http 层、守卫辅助函数）读取会话 */
export const session = {
  getToken: (): string | null => useSessionStore.getState().token,
  getUser: (): SessionUser | null => useSessionStore.getState().user,
  getRole: (): Role | null => useSessionStore.getState().user?.role ?? null,
  set: (payload: { token: string; user: SessionUser }): void =>
    useSessionStore.getState().setSession(payload),
  clear: (): void => useSessionStore.getState().clear(),
}

/**
 * 把会话注入 http 层：401 并发去重在 http 层已处理，这里只负责清会话与跳转。
 */
configureHttpAuth({
  getToken: () => useSessionStore.getState().token,
  onUnauthorized: () => {
    useSessionStore.getState().clear()
    if (!window.location.pathname.startsWith('/login')) {
      const redirect = encodeURIComponent(`${window.location.pathname}${window.location.search}`)
      window.location.assign(`/login?redirect=${redirect}`)
    }
  },
})
