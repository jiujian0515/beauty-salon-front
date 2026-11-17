export const ROLES = {
  STAFF: 'STAFF',
  ADMIN: 'ADMIN',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

export const PERMISSIONS = {
  SERVICE_WRITE: 'service:write',
  RESOURCE_WRITE: 'resource:write',
  SCHEDULE_WRITE: 'schedule:write',
  SLOT_LOCK: 'slot:lock',
  RESERVATION_CREATE: 'reservation:create',
  RESERVATION_CANCEL: 'reservation:cancel',
  RESERVATION_CHECKIN: 'reservation:checkin',
  RESERVATION_CHECKIN_FORCE: 'reservation:checkin:force',
  STAFF_MANAGE: 'staff:manage',
  AUDIT_READ: 'audit:read',
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

const STAFF_PERMISSIONS: readonly Permission[] = [
  PERMISSIONS.RESOURCE_WRITE,
  PERMISSIONS.SCHEDULE_WRITE,
  PERMISSIONS.SLOT_LOCK,
  PERMISSIONS.RESERVATION_CHECKIN,
]

const ADMIN_PERMISSIONS: readonly Permission[] = [
  ...STAFF_PERMISSIONS,
  PERMISSIONS.SERVICE_WRITE,
  PERMISSIONS.RESERVATION_CREATE,
  PERMISSIONS.RESERVATION_CANCEL,
  PERMISSIONS.RESERVATION_CHECKIN_FORCE,
  PERMISSIONS.STAFF_MANAGE,
  PERMISSIONS.AUDIT_READ,
]

/** 角色 → 权限矩阵（PRD §3），判定函数见 utils/permission */
export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  STAFF: STAFF_PERMISSIONS,
  ADMIN: ADMIN_PERMISSIONS,
}
