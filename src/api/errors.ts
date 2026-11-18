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

/**
 * 与后端 ErrorCode 枚举一一对应（5 位：前两位为 HTTP 语义，后三位为业务细分）。
 * 后端业务失败统一以 HTTP 200 + code !== 0 返回，因此 code 是唯一判定依据。
 */
export const BUSINESS_CODE = {
  SUCCESS: 0,
  PARAM_ERROR: 40001,
  NOT_LOGIN: 40101,
  NO_PERMISSION: 40301,
  NOT_FOUND: 40401,
  SLOT_FULL: 40901,
  STATUS_INVALID: 40902,
  CANCEL_TOO_LATE: 40903,
  DUPLICATE_DATA: 40904,
  IN_USE: 40905,
  SYSTEM_ERROR: 50000,
} as const

interface BusinessCodeMeta {
  kind: ErrorKind
  /** 后端未给出可读信息时的兜底文案 */
  message: string
}

const BUSINESS_CODE_META: Record<number, BusinessCodeMeta> = {
  [BUSINESS_CODE.PARAM_ERROR]: { kind: 'validation', message: '提交内容有误，请检查后重试' },
  [BUSINESS_CODE.NOT_LOGIN]: { kind: 'unauthorized', message: '登录状态已失效，请重新登录' },
  [BUSINESS_CODE.NO_PERMISSION]: { kind: 'forbidden', message: '无权限执行该操作' },
  [BUSINESS_CODE.NOT_FOUND]: { kind: 'notFound', message: '记录不存在或已被删除' },
  [BUSINESS_CODE.SLOT_FULL]: { kind: 'conflict', message: '该时段已约满，已为你刷新' },
  [BUSINESS_CODE.STATUS_INVALID]: { kind: 'conflict', message: '预约状态已变化，已为你刷新' },
  [BUSINESS_CODE.CANCEL_TOO_LATE]: {
    kind: 'business',
    message: '距服务开始不足 24 小时，不可取消',
  },
  [BUSINESS_CODE.DUPLICATE_DATA]: { kind: 'business', message: '数据已存在，请勿重复提交' },
  [BUSINESS_CODE.IN_USE]: { kind: 'business', message: '该数据已被引用，无法删除' },
  [BUSINESS_CODE.SYSTEM_ERROR]: { kind: 'server', message: '服务暂时不可用，请稍后重试' },
}

/**
 * 业务码 → AppError。后端 message 更贴合具体场景（例如 40101 既表示「未登录」也表示
 * 「手机号或密码错误」），因此优先使用后端文案，缺失时才用兜底文案。
 */
export function fromBusinessCode(code: number, serverMessage?: string): AppError {
  const meta: BusinessCodeMeta | undefined = BUSINESS_CODE_META[code]
  if (meta) {
    return new AppError({ kind: meta.kind, message: serverMessage || meta.message, code })
  }
  return new AppError({
    kind: 'business',
    message: serverMessage || '操作未能完成，请稍后重试',
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
