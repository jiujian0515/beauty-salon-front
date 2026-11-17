const YUAN_PATTERN = /^-?\d{1,9}(\.\d{1,2})?$/

/** 整数分求和，避免逐条格式化后再累加（BTD §8.1） */
export function sumFen(values: readonly number[]): number {
  return values.reduce((total, value) => total + Math.trunc(value), 0)
}

/** 分 → 「1,280.00」，仅用于展示 */
export function formatYuan(fen: number | null | undefined): string {
  if (fen === null || fen === undefined || !Number.isFinite(fen)) return '—'
  const truncated = Math.trunc(fen)
  const negative = truncated < 0
  const absolute = Math.abs(truncated)
  const yuan = Math.floor(absolute / 100)
  const cents = absolute % 100
  const grouped = String(yuan).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `${negative ? '-' : ''}${grouped}.${String(cents).padStart(2, '0')}`
}

/** 分 → 「¥1,280.00」 */
export function formatMoney(fen: number | null | undefined): string {
  if (fen === null || fen === undefined || !Number.isFinite(fen)) return '—'
  return `¥${formatYuan(fen)}`
}

/**
 * 元字符串 → 整数分。按小数点切分拼装，不经过浮点乘法（BTD §8.1）。
 * 非法输入返回 null。
 */
export function parseYuanToFen(input: string): number | null {
  const trimmed = input.trim()
  if (!YUAN_PATTERN.test(trimmed)) return null
  const negative = trimmed.startsWith('-')
  const unsigned = negative ? trimmed.slice(1) : trimmed
  const [yuanPart = '0', centPart = ''] = unsigned.split('.')
  const value = Number(yuanPart) * 100 + Number(centPart.padEnd(2, '0'))
  return negative ? -value : value
}

/** 分 → 表单可编辑的元字符串（无千分位） */
export function fenToYuanInput(fen: number | null | undefined): string {
  if (fen === null || fen === undefined || !Number.isFinite(fen)) return ''
  const truncated = Math.trunc(fen)
  const negative = truncated < 0
  const absolute = Math.abs(truncated)
  const yuan = Math.floor(absolute / 100)
  const cents = String(absolute % 100).padStart(2, '0')
  return `${negative ? '-' : ''}${yuan}.${cents}`
}
