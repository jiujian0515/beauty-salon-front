import { Alert, App, Button, Drawer, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { errorMessage } from '@/api/errors'
import type { Schedule, ScheduleSlot } from '@/api/schedule'
import { QueryBoundary } from '@/components'
import { useLockSlot, useUnlockSlot } from '@/hooks/useSlotMutations'
import { useScheduleSlots } from '../hooks'

export interface ScheduleSlotsDrawerProps {
  open: boolean
  schedule: Schedule | null
  onClose: () => void
}

export function ScheduleSlotsDrawer({ open, schedule, onClose }: ScheduleSlotsDrawerProps) {
  const { message, modal } = App.useApp()
  const slotsQuery = useScheduleSlots(schedule?.id ?? null, open)
  const lockMutation = useLockSlot()
  const unlockMutation = useUnlockSlot()

  const scheduleActive = schedule?.status === 1

  const handleLock = (slot: ScheduleSlot) => {
    modal.confirm({
      title: '锁定时段',
      content: `锁定后 ${slot.startTime}–${slot.endTime} 将暂停售卖，已占用数不受影响，可随时释放。`,
      okText: '确认锁定',
      cancelText: '取消',
      onOk: () =>
        lockMutation
          .mutateAsync(slot.id)
          .then(() => message.success('时段已锁定'))
          .catch((error: unknown) => message.error(errorMessage(error))),
    })
  }

  const handleUnlock = (slot: ScheduleSlot) => {
    unlockMutation.mutate(slot.id, {
      onSuccess: () => message.success('时段已释放'),
      onError: (error) => message.error(errorMessage(error)),
    })
  }

  const columns: ColumnsType<ScheduleSlot> = [
    {
      title: '时段',
      key: 'time',
      width: 130,
      render: (_, record) => `${record.startTime}–${record.endTime}`,
    },
    { title: '容量', dataIndex: 'total', width: 70 },
    { title: '已用', dataIndex: 'used', width: 70 },
    { title: '可售', dataIndex: 'available', width: 70 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (value: number) =>
        value === 1 ? <Tag color="success">可售</Tag> : <Tag>已锁定</Tag>,
    },
    {
      title: '操作',
      key: 'actions',
      width: 90,
      render: (_, record) =>
        record.status === 1 ? (
          <Button
            type="link"
            size="small"
            danger
            loading={lockMutation.isPending && lockMutation.variables === record.id}
            onClick={() => handleLock(record)}
          >
            锁定
          </Button>
        ) : (
          <Button
            type="link"
            size="small"
            disabled={!scheduleActive}
            loading={unlockMutation.isPending && unlockMutation.variables === record.id}
            onClick={() => handleUnlock(record)}
          >
            释放
          </Button>
        ),
    },
  ]

  return (
    <Drawer title="时段库存" width={640} open={open} onClose={onClose} destroyOnHidden>
      {schedule ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-500">
          <span>
            {schedule.resourceName || '—'} · {schedule.scheduleDate} {schedule.startTime}–
            {schedule.endTime}
          </span>
          <span>
            共 {schedule.slotCount} 个时段 · 可售 {schedule.availableCount} /{' '}
            {schedule.totalCapacity}
            {schedule.lockedCount > 0 ? ` · 锁定 ${schedule.lockedCount}` : ''}
          </span>
        </div>
      ) : null}

      {scheduleActive ? null : (
        <Alert
          className="mb-4"
          type="warning"
          showIcon
          message="排班当前为无效状态"
          description="窗口内时段已全部锁定，需先在列表中启用排班后才能释放单个时段。"
        />
      )}

      <QueryBoundary
        loading={slotsQuery.isLoading}
        error={slotsQuery.error}
        onRetry={() => void slotsQuery.refetch()}
        empty={slotsQuery.data?.length === 0}
        emptyText="该窗口内暂无时段库存"
      >
        <Table<ScheduleSlot>
          rowKey="id"
          size="small"
          columns={columns}
          dataSource={slotsQuery.data ?? []}
          loading={slotsQuery.isFetching && !slotsQuery.isLoading}
          pagination={false}
          scroll={{ y: 430 }}
          locale={{ emptyText: '该窗口内暂无时段库存' }}
        />
      </QueryBoundary>
    </Drawer>
  )
}
