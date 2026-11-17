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
