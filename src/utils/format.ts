/** 手机号脱敏：138****5678 */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return '—'
  const trimmed = phone.trim()
  if (trimmed.length < 7) return trimmed
  return `${trimmed.slice(0, 3)}****${trimmed.slice(-4)}`
}

/** 空值统一显示为短横 */
export function orDash(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—'
  return String(value)
}
