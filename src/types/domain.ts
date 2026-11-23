export interface StatusMeta {
  label: string
  color: string
}

export const RESERVATION_STATUS = {
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  CONFIRMED: 'CONFIRMED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED',
  REFUNDING: 'REFUNDING',
  REFUNDED: 'REFUNDED',
} as const

export type ReservationStatus = (typeof RESERVATION_STATUS)[keyof typeof RESERVATION_STATUS]

export const RESOURCE_TYPE = {
  /** 技师 */
  STAFF: 'STAFF',
  /** 床位 / 房间 */
  ROOM: 'ROOM',
} as const

export type ResourceType = (typeof RESOURCE_TYPE)[keyof typeof RESOURCE_TYPE]

export const SERVICE_CATEGORY = {
  /** 尊享身体理疗 */
  SPA_BODY: 'SPA_BODY',
  /** 尊享面部 */
  SPA_FACE: 'SPA_FACE',
  /** 尊享其他 */
  SPA_OTHER: 'SPA_OTHER',
} as const

export type ServiceCategory = (typeof SERVICE_CATEGORY)[keyof typeof SERVICE_CATEGORY]

/** 判断是否为已定义的服务分类 code（后端存储 code，历史数据可能为空或旧值） */
export function isServiceCategory(value: string | null | undefined): value is ServiceCategory {
  return (
    value === SERVICE_CATEGORY.SPA_BODY ||
    value === SERVICE_CATEGORY.SPA_FACE ||
    value === SERVICE_CATEGORY.SPA_OTHER
  )
}

export const DEPOSIT_STATUS = {
  PENDING: 'PENDING',
  SUCCESS: 'SUCCESS',
  REFUNDED: 'REFUNDED',
  FAILED: 'FAILED',
  EXPIRED: 'EXPIRED',
} as const

export type DepositStatus = (typeof DEPOSIT_STATUS)[keyof typeof DEPOSIT_STATUS]

export type ReservationAction = 'view' | 'checkin' | 'checkin-force' | 'cancel'

export type SlotState = 'available' | 'full' | 'locked' | 'tooSoon' | 'past'

export interface SlotStateInput {
  total: number
  used: number
  locked: boolean
  /** 时段开始时间，配合 endAt 判断是否已结束 */
  startAt: string | number | Date
  endAt?: string | number | Date
}
