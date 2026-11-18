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
  ROLE_MANAGE: 'role:manage',
  AUDIT_READ: 'audit:read',
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

/** 权限点中文名：角色页与权限提示的唯一来源 */
export const PERMISSION_LABELS: Record<Permission, string> = {
  [PERMISSIONS.SERVICE_WRITE]: '服务项目维护',
  [PERMISSIONS.RESOURCE_WRITE]: '资源维护',
  [PERMISSIONS.SCHEDULE_WRITE]: '排班维护',
  [PERMISSIONS.SLOT_LOCK]: '时段锁定/释放',
  [PERMISSIONS.RESERVATION_CREATE]: '代客下单',
  [PERMISSIONS.RESERVATION_CANCEL]: '取消预约与退款',
  [PERMISSIONS.RESERVATION_CHECKIN]: '发起核销',
  [PERMISSIONS.RESERVATION_CHECKIN_FORCE]: '代顾客确认核销',
  [PERMISSIONS.STAFF_MANAGE]: '员工维护',
  [PERMISSIONS.ROLE_MANAGE]: '角色维护',
  [PERMISSIONS.AUDIT_READ]: '审计日志查看',
}

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
  PERMISSIONS.ROLE_MANAGE,
  PERMISSIONS.AUDIT_READ,
]

/** 角色 → 权限矩阵（PRD §3），判定函数见 utils/permission */
export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  STAFF: STAFF_PERMISSIONS,
  ADMIN: ADMIN_PERMISSIONS,
}

export const ROLE_LABELS: Record<Role, string> = {
  STAFF: '员工',
  ADMIN: '管理员',
}

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  STAFF: '使用后台处理排班与核销，不可修改服务项目与价格，不可取消预约与退款',
  ADMIN: '拥有商户侧全部权限，含服务项目、员工与角色管理',
}
