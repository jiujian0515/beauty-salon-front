import type { ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router'
import { useSessionStore } from '@/stores/session'

/** 未登录一律跳登录页，并携带站内回跳路径（BTD §7.2） */
export function RequireAuth({ children }: { children?: ReactNode }) {
  const token = useSessionStore((state) => state.token)
  const location = useLocation()

  if (!token) {
    const redirect = encodeURIComponent(`${location.pathname}${location.search}`)
    return <Navigate to={`/login?redirect=${redirect}`} replace />
  }

  return children ? <>{children}</> : <Outlet />
}
