import type { DepositStatus, ReservationStatus, SlotState, StatusMeta } from '@/types/domain'

/** 状态文案与颜色：全站唯一来源，页面内禁止硬编码（BTD §8.9） */
export const RESERVATION_STATUS_META: Record<ReservationStatus, StatusMeta> = {
  PENDING_PAYMENT: { label: '待支付', color: 'processing' },
  CONFIRMED: { label: '已确认', color: 'cyan' },
  COMPLETED: { label: '已完成', color: 'success' },
  CANCELLED: { label: '已取消', color: 'default' },
  EXPIRED: { label: '已过期', color: 'default' },
  REFUNDING: { label: '退款中', color: 'warning' },
  REFUNDED: { label: '已退款', color: 'geekblue' },
}

export const DEPOSIT_STATUS_META: Record<DepositStatus, StatusMeta> = {
  PENDING: { label: '待支付', color: 'processing' },
  SUCCESS: { label: '支付成功', color: 'success' },
  REFUNDED: { label: '已退款', color: 'geekblue' },
  FAILED: { label: '支付失败', color: 'error' },
  EXPIRED: { label: '已关闭', color: 'default' },
}

export const SLOT_STATE_META: Record<SlotState, StatusMeta> = {
  available: { label: '可售', color: 'success' },
  full: { label: '已满', color: 'error' },
  locked: { label: '已锁定', color: 'default' },
  tooSoon: { label: '需提前 24 小时', color: 'warning' },
  past: { label: '已结束', color: 'default' },
}
