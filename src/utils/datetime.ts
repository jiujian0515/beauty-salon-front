import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import duration from 'dayjs/plugin/duration'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import 'dayjs/locale/zh-cn'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(duration)
dayjs.locale('zh-cn')

/** 业务时区固定为 Asia/Shanghai（PRD §6） */
export const APP_TIMEZONE = 'Asia/Shanghai'
export const DATE_FORMAT = 'YYYY-MM-DD'
export const TIME_FORMAT = 'HH:mm'
export const DATE_TIME_FORMAT = 'YYYY-MM-DD HH:mm'

export type DateInput = string | number | Date | Dayjs | null | undefined

export function toDayjs(value: DateInput): Dayjs | null {
  if (value === null || value === undefined || value === '') return null
  const parsed = dayjs.isDayjs(value) ? value : dayjs(value)
  return parsed.isValid() ? parsed : null
}

export function now(): Dayjs {
  return dayjs().tz(APP_TIMEZONE)
}

export function today(): string {
  return now().format(DATE_FORMAT)
}

export function formatDate(value: DateInput): string {
  const parsed = toDayjs(value)
  return parsed ? parsed.format(DATE_FORMAT) : '—'
}

export function formatTime(value: DateInput): string {
  const parsed = toDayjs(value)
  return parsed ? parsed.format(TIME_FORMAT) : '—'
}

export function formatDateTime(value: DateInput): string {
  const parsed = toDayjs(value)
  return parsed ? parsed.format(DATE_TIME_FORMAT) : '—'
}

/** 时段区间：同一天用 09:00–12:00，跨天带日期前缀 */
export function formatSlotRange(start: DateInput, end: DateInput): string {
  const startAt = toDayjs(start)
  const endAt = toDayjs(end)
  if (!startAt || !endAt) return '—'
  if (startAt.isSame(endAt, 'day')) {
    return `${startAt.format(TIME_FORMAT)}–${endAt.format(TIME_FORMAT)}`
  }
  return `${startAt.format('MM-DD HH:mm')} – ${endAt.format('MM-DD HH:mm')}`
}

export function formatDurationMinutes(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined || !Number.isFinite(minutes)) return '—'
  const total = Math.max(0, Math.round(minutes))
  const hours = Math.floor(total / 60)
  const rest = total % 60
  if (hours > 0 && rest > 0) return `${hours}小时${rest}分钟`
  if (hours > 0) return `${hours}小时`
  return `${rest}分钟`
}

/** 服务开始时间是否满足提前量要求（PRD §6：≥ 当前时间 + 24 小时） */
export function isBeyondLeadTime(
  startAt: DateInput,
  leadHours: number,
  reference: Dayjs = now(),
): boolean {
  const target = toDayjs(startAt)
  if (!target) return false
  return !target.isBefore(reference.add(leadHours, 'hour'))
}

/** 是否仍在自助取消时限内（服务开始前 ≥ freeHours） */
export function isBeforeCancelDeadline(
  startAt: DateInput,
  freeHours: number,
  reference: Dayjs = now(),
): boolean {
  const target = toDayjs(startAt)
  if (!target) return false
  return !target.subtract(freeHours, 'hour').isBefore(reference)
}

export function isPast(value: DateInput, reference: Dayjs = now()): boolean {
  const parsed = toDayjs(value)
  if (!parsed) return false
  return parsed.isBefore(reference)
}

/** 剩余毫秒 → 「1:58:31」 */
export function formatCountdown(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export { dayjs }
