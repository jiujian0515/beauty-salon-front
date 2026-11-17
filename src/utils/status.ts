import { BOOKING_LEAD_HOURS } from '@/constants/constants'
import type { Role } from '@/constants/permissions'
import { RESERVATION_STATUS } from '@/types/domain'
import type {
  ReservationAction,
  ReservationStatus,
  SlotState,
  SlotStateInput,
} from '@/types/domain'
import { isBeyondLeadTime, isPast, now, toDayjs } from '@/utils/datetime'
import type { DateInput } from '@/utils/datetime'
import type { Dayjs } from 'dayjs'

/**
 * 状态 → 可用操作（BTD §8.9）。角色不满足的操作不返回，页面据此不渲染按钮。
 */
export function allowedReservationActions(
  status: ReservationStatus,
  role: Role | null | undefined,
): ReservationAction[] {
  const actions: ReservationAction[] = ['view']
  if (status === RESERVATION_STATUS.CONFIRMED && role) {
    actions.push('checkin')
    if (role === 'ADMIN') actions.push('checkin-force')
  }
  if (
    role === 'ADMIN' &&
    (status === RESERVATION_STATUS.PENDING_PAYMENT || status === RESERVATION_STATUS.CONFIRMED)
  ) {
    actions.push('cancel')
  }
  return actions
}

/**
 * 时段可售状态派生，优先级：已结束 > 已锁定 > 已满 > 不可预约（<24h）> 可售。
 */
export function deriveSlotState(input: SlotStateInput, reference: Dayjs = now()): SlotState {
  const startAt: DateInput = input.startAt
  const endAt: DateInput = input.endAt ?? input.startAt
  const end = toDayjs(endAt)
  if (end && isPast(end, reference)) return 'past'
  if (input.locked) return 'locked'
  if (input.used >= input.total) return 'full'
  if (!isBeyondLeadTime(startAt, BOOKING_LEAD_HOURS, reference)) return 'tooSoon'
  return 'available'
}
