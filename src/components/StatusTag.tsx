import { Tag } from 'antd'
import { DEPOSIT_STATUS_META, RESERVATION_STATUS_META } from '@/constants/status'
import type { DepositStatus, ReservationStatus, StatusMeta } from '@/types/domain'

export type StatusTagProps =
  | { kind: 'reservation'; value: ReservationStatus }
  | { kind: 'deposit'; value: DepositStatus }
  | { kind: 'custom'; meta: StatusMeta }

/** 状态徽标：颜色与文案的唯一来源，禁止页面内硬编码（BTD §5.2） */
export function StatusTag(props: StatusTagProps) {
  let meta: StatusMeta
  if (props.kind === 'reservation') {
    meta = RESERVATION_STATUS_META[props.value]
  } else if (props.kind === 'deposit') {
    meta = DEPOSIT_STATUS_META[props.value]
  } else {
    meta = props.meta
  }
  return <Tag color={meta.color}>{meta.label}</Tag>
}
