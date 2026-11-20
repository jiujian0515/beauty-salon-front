export const PAGE_SIZE = 20
export const PAGE_SIZE_OPTIONS = [20, 50, 100]

/** 预约提前量：服务开始时间需 ≥ 当前时间 + 24 小时（PRD §6） */
export const BOOKING_LEAD_HOURS = 24
/** 待支付占位时限：2 小时（PRD §6） */
export const PAYMENT_HOLD_HOURS = 2
/** 自助取消时限：服务开始前 24 小时（PRD §6） */
export const CANCEL_FREE_HOURS = 24

export const SERVICE_DURATION_STEP = 15
export const MAX_AMOUNT_FEN = 10_000_000

export const RESERVATION_POLL_MS = 60_000
export const RESERVATION_PENDING_CONFIRM_POLL_MS = 5_000
export const DEPOSIT_POLL_MS = 60_000
export const DASHBOARD_POLL_MS = 60_000
export const CALENDAR_POLL_MS = 30_000

export const DEFAULT_CALENDAR_VIEW = 'day'
export const DEFAULT_RESERVATION_RANGE_DAYS = 7
