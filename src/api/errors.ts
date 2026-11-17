export type ErrorKind =
  | 'unauthorized'
  | 'forbidden'
  | 'notFound'
  | 'validation'
  | 'conflict'
  | 'business'
  | 'network'
  | 'timeout'
  | 'server'
  | 'unknown'

export interface AppErrorInit {
  kind: ErrorKind
  message: string
  code?: number
  httpStatus?: number
  traceId?: string
  details?: unknown
}

/** 页面层只处理 kind，不关心 HTTP 与业务码的差异（BTD §7.1） */
export class AppError extends Error {
  readonly kind: ErrorKind
  readonly code?: number
  readonly httpStatus?: number
  readonly traceId?: string
  readonly details?: unknown

  constructor(init: AppErrorInit) {
    super(init.message)
    this.name = 'AppError'
    this.kind = init.kind
    this.code = init.code
    this.httpStatus = init.httpStatus
    this.traceId = init.traceId
    this.details = init.details
  }
}

export function isAppError(value: unknown): value is AppError {
  return value instanceof AppError
}

export function errorMessage(value: unknown, fallback = '操作未能完成，请稍后重试'): string {
  if (isAppError(value)) return value.message
  if (value instanceof Error && value.message) return value.message
  return fallback
}

/** 业务码为前端期望语义，最终数字以 README-BTD.md 为准（BTD §7.4） */
export const BUSINESS_CODE = {
  OK: 0,
  UNAUTHORIZED: 1001,
  TOKEN_EXPIRED: 1002,
  FORBIDDEN: 1003,
  VALIDATION_FAILED: 2001,
  SLOT_SOLD_OUT: 3001,
  SLOT_LOCKED: 3002,
  RESERVATION_STATE_INVALID: 3003,
  BOOKING_LEAD_TIME: 3004,
  CANCEL_DEADLINE: 3005,
  SCHEDULE_CONFLICT: 3006,
  DEPOSIT_NOT_FOUND: 4001,
  DUPLICATED: 4002,
  SERVER_ERROR: 5000,
} as const

interface BusinessCodeMeta {
  kind: ErrorKind
  message: string
}

const BUSINESS_CODE_META: Record<number, BusinessCodeMeta> = {
  [BUSINESS_CODE.UNAUTHORIZED]: { kind: 'unauthorized', message: '登录状态已失效，请重新登录' },
  [BUSINESS_CODE.TOKEN_EXPIRED]: { kind: 'unauthorized', message: '登录已过期，请重新登录' },
  [BUSINESS_CODE.FORBIDDEN]: { kind: 'forbidden', message: '无权限执行该操作' },
  [BUSINESS_CODE.VALIDATION_FAILED]: { kind: 'validation', message: '提交内容有误，请检查后重试' },
  [BUSINESS_CODE.SLOT_SOLD_OUT]: { kind: 'conflict', message: '该时段已约满，已为你刷新日历' },
  [BUSINESS_CODE.SLOT_LOCKED]: { kind: 'conflict', message: '该时段已暂停售卖，已为你刷新' },
  [BUSINESS_CODE.RESERVATION_STATE_INVALID]: {
    kind: 'conflict',
    message: '预约状态已变化，已为你刷新',
  },
  [BUSINESS_CODE.BOOKING_LEAD_TIME]: {
    kind: 'business',
    message: '该时段需提前 24 小时预约，请选择更晚的时段',
  },
  [BUSINESS_CODE.CANCEL_DEADLINE]: {
    kind: 'business',
    message: '距服务开始不足 24 小时，不可自助取消，请联系商户处理',
  },
  [BUSINESS_CODE.SCHEDULE_CONFLICT]: {
    kind: 'conflict',
    message: '排班与既有预约冲突，已标记冲突时段',
  },
  [BUSINESS_CODE.DEPOSIT_NOT_FOUND]: { kind: 'business', message: '未找到对应的定金流水' },
  [BUSINESS_CODE.DUPLICATED]: { kind: 'business', message: '操作已完成，无需重复提交' },
  [BUSINESS_CODE.SERVER_ERROR]: { kind: 'server', message: '服务暂时不可用，请稍后重试' },
}

export function fromBusinessCode(code: number, fallbackMessage?: string): AppError {
  const meta: BusinessCodeMeta | undefined = BUSINESS_CODE_META[code]
  if (meta) return new AppError({ kind: meta.kind, message: meta.message, code })
  return new AppError({
    kind: 'business',
    message: fallbackMessage || '操作未能完成，请稍后重试',
    code,
  })
}

export function fromHttpStatus(status: number, message?: string): AppError {
  if (status === 401) {
    return new AppError({
      kind: 'unauthorized',
      message: '登录状态已失效，请重新登录',
      httpStatus: status,
    })
  }
  if (status === 403) {
    return new AppError({ kind: 'forbidden', message: '无权限执行该操作', httpStatus: status })
  }
  if (status === 404) {
    return new AppError({ kind: 'notFound', message: '记录不存在或已被删除', httpStatus: status })
  }
  if (status === 400 || status === 422) {
    return new AppError({
      kind: 'validation',
      message: message || '提交内容有误，请检查后重试',
      httpStatus: status,
    })
  }
  if (status === 409) {
    return new AppError({
      kind: 'conflict',
      message: message || '数据已变化，请刷新后重试',
      httpStatus: status,
    })
  }
  if (status >= 500) {
    return new AppError({
      kind: 'server',
      message: '服务暂时不可用，请稍后重试',
      httpStatus: status,
    })
  }
  return new AppError({
    kind: 'unknown',
    message: message || '请求失败，请稍后重试',
    httpStatus: status,
  })
}
