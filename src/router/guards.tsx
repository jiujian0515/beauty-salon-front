import type { ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router'
import { hasAnyRole } from '@/utils/permission'
import type { Role } from '@/constants/permissions'
import { useSessionStore } from '@/stores/session'
import { Forbidden } from '@/pages/error/Forbidden'

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

interface RequireRoleProps {
  roles: readonly Role[]
  children?: ReactNode
}

/** 角色守卫：可包裹单页（children）或作为无路径布局（Outlet） */
export function RequireRole({ roles, children }: RequireRoleProps) {
  const role = useSessionStore((state) => state.user?.role)

  if (!hasAnyRole(role, roles)) {
    return <Forbidden />
  }

  return children ? <>{children}</> : <Outlet />
}
