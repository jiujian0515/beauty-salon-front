import { ROLE_PERMISSIONS } from '@/constants/permissions'
import type { Permission, Role } from '@/constants/permissions'

/** 权限判定统一出口（BTD §11.2）；组件内通过 hooks/usePermission 使用 */
export function hasPermission(role: Role | null | undefined, permission: Permission): boolean {
  if (!role) return false
  return ROLE_PERMISSIONS[role].includes(permission)
}

export function hasAnyRole(role: Role | null | undefined, roles: readonly Role[]): boolean {
  if (!role) return false
  return roles.includes(role)
}
