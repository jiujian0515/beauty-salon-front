import type { Permission, Role } from '@/constants/permissions'
import { useSessionStore } from '@/stores/session'
import { hasAnyRole, hasPermission } from '@/utils/permission'

export function usePermission(permission: Permission): boolean {
  const role = useSessionStore((state) => state.user?.role)
  return hasPermission(role, permission)
}

export function useHasRole(roles: readonly Role[]): boolean {
  const role = useSessionStore((state) => state.user?.role)
  return hasAnyRole(role, roles)
}

export function useCurrentRole(): Role | null {
  return useSessionStore((state) => state.user?.role ?? null)
}
