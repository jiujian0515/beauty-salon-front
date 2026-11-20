import { Alert, App, Button, Descriptions, Drawer, Space, Tag } from 'antd'
import { errorMessage } from '@/api/errors'
import type { ScheduleSlot } from '@/api/schedule'
import { useLockSlot, useUnlockSlot } from '@/hooks/useSlotMutations'
import { formatDateTime } from '@/utils/datetime'

export interface CalendarSlotDrawerProps {
  open: boolean
  slot: ScheduleSlot | null
  /** 所属排班是否有效；无效时不允许释放单个时段 */
  scheduleActive: boolean
  onClose: () => void
}

export function CalendarSlotDrawer({
  open,
  slot,
  scheduleActive,
  onClose,
}: CalendarSlotDrawerProps) {
  const { message, modal } = App.useApp()
  const lockMutation = useLockSlot()
  const unlockMutation = useUnlockSlot()

  const handleLock = () => {
    if (!slot) return
    modal.confirm({
      title: '锁定时段',
      content: `锁定后 ${slot.startTime}–${slot.endTime} 将暂停售卖，已占用数不受影响，可随时释放。`,
      okText: '确认锁定',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () =>
        lockMutation
          .mutateAsync(slot.id)
          .then(() => message.success('时段已锁定'))
          .catch((error: unknown) => message.error(errorMessage(error))),
    })
  }

  const handleUnlock = () => {
    if (!slot) return
    unlockMutation.mutate(slot.id, {
      onSuccess: () => message.success('时段已释放'),
      onError: (error) => message.error(errorMessage(error)),
    })
  }

  return (
    <Drawer
      title="时段详情"
      width={420}
      open={open}
      onClose={onClose}
      destroyOnHidden
      footer={
        slot ? (
          <div className="flex justify-end">
            <Space>
              <Button onClick={onClose}>关闭</Button>
              {slot.status === 1 ? (
                <Button danger type="primary" loading={lockMutation.isPending} onClick={handleLock}>
                  锁定该时段
                </Button>
              ) : (
                <Button
                  type="primary"
                  disabled={!scheduleActive}
                  loading={unlockMutation.isPending}
                  onClick={handleUnlock}
                >
                  释放该时段
                </Button>
              )}
            </Space>
          </div>
        ) : null
      }
    >
      {slot ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="text-lg font-medium text-slate-900">
              {slot.startTime}–{slot.endTime}
            </span>
            {slot.status === 1 ? <Tag color="success">可售</Tag> : <Tag>已锁定</Tag>}
          </div>

          {slot.status === 0 && !scheduleActive ? (
            <Alert
              type="warning"
              showIcon
              message="所属排班无效"
              description="需先在「排班管理」中启用该排班，才能释放此时段。"
            />
          ) : null}

          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="资源">{slot.resourceName || '—'}</Descriptions.Item>
            <Descriptions.Item label="日期">{slot.slotDate}</Descriptions.Item>
            <Descriptions.Item label="容量">{slot.total}</Descriptions.Item>
            <Descriptions.Item label="已占用">{slot.used}</Descriptions.Item>
            <Descriptions.Item label="可售">
              <span className={slot.available > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                {slot.available}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">{formatDateTime(slot.createdAt)}</Descriptions.Item>
          </Descriptions>

          <p className="m-0 text-xs text-slate-400">
            锁定时段仅暂停售卖，不影响已产生的预约与占用数。
          </p>
        </div>
      ) : null}
    </Drawer>
  )
}
