import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { App, Button, Card, DatePicker, Select, Space, Switch, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { Dayjs } from 'dayjs'
import { useState } from 'react'
import { Link } from 'react-router'
import { errorMessage } from '@/api/errors'
import type { Schedule } from '@/api/schedule'
import { DurationText, PageHeader, QueryBoundary } from '@/components'
import { RESOURCE_TYPE_META } from '@/constants/status'
import { dayjs, formatDate, formatDateTime } from '@/utils/datetime'
import { BatchScheduleDrawer } from './components/BatchScheduleDrawer'
import { ScheduleFormDrawer } from './components/ScheduleFormDrawer'
import { ScheduleSlotsDrawer } from './components/ScheduleSlotsDrawer'
import {
  useDeleteSchedule,
  useResourceSelectOptions,
  useScheduleListPage,
  useUpdateSchedule,
} from './hooks'

const STATUS_OPTIONS = [
  { value: '1', label: '有效' },
  { value: '0', label: '无效' },
]

export default function SchedulePage() {
  const { message, modal } = App.useApp()

  const list = useScheduleListPage()
  const updateMutation = useUpdateSchedule()
  const deleteMutation = useDeleteSchedule()
  const { options: resourceOptions, loading: resourcesLoading } = useResourceSelectOptions()

  const [formOpen, setFormOpen] = useState(false)
  const [batchOpen, setBatchOpen] = useState(false)
  const [editing, setEditing] = useState<Schedule | null>(null)
  const [slotsTarget, setSlotsTarget] = useState<Schedule | null>(null)

  const { startDate, endDate } = list.params.filters
  const rangeValue: [Dayjs, Dayjs] | null =
    startDate && endDate ? [dayjs(startDate), dayjs(endDate)] : null

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (record: Schedule) => {
    setEditing(record)
    setFormOpen(true)
  }

  const handleToggleStatus = (record: Schedule, enabled: boolean) => {
    const apply = () =>
      updateMutation.mutate(
        { id: record.id, payload: { status: enabled ? 1 : 0 } },
        {
          onSuccess: () => message.success(enabled ? '排班已启用' : '排班已停用'),
          onError: (err) => message.error(errorMessage(err)),
        },
      )

    modal.confirm({
      title: enabled ? '启用排班' : '停用排班',
      content: enabled
        ? '启用后窗口内所有时段将恢复可售（会覆盖手工锁定），已有预约不受影响。'
        : '停用后窗口内所有时段将被锁定（会覆盖手工锁定），已有预约不受影响，可随时重新启用。',
      okText: enabled ? '确认启用' : '确认停用',
      cancelText: '取消',
      okButtonProps: { danger: !enabled },
      onOk: apply,
    })
  }

  const handleDelete = (record: Schedule) => {
    modal.confirm({
      title: '删除排班',
      content: `将删除 ${record.scheduleDate} ${record.startTime}–${record.endTime} 的排班及其全部时段；若已有预约占用则无法删除，可将状态改为无效。`,
      okText: '确认删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () =>
        deleteMutation
          .mutateAsync(record.id)
          .then(() => {
            message.success('排班已删除')
            list.handleDeleted()
          })
          .catch((err: unknown) => message.error(errorMessage(err))),
    })
  }

  const columns: ColumnsType<Schedule> = [
    {
      title: '排班日期',
      dataIndex: 'scheduleDate',
      width: 170,
      render: (value: string, record) => (
        <div>
          <div className="font-medium text-slate-900">
            {formatDate(value)} {dayjs(value).format('ddd')}
          </div>
          <div className="mt-0.5 text-xs text-slate-400">
            {record.startTime}–{record.endTime}
          </div>
        </div>
      ),
    },
    {
      title: '资源',
      key: 'resource',
      width: 180,
      render: (_, record) => (
        <div>
          <div className="text-slate-900">{record.resourceName || '—'}</div>
          {record.resourceType ? (
            <Tag className="mt-1" color={RESOURCE_TYPE_META[record.resourceType].color}>
              {RESOURCE_TYPE_META[record.resourceType].label}
            </Tag>
          ) : null}
        </div>
      ),
    },
    {
      title: '拆分步长',
      dataIndex: 'slotMinutes',
      width: 110,
      render: (value: number) => <DurationText minutes={value} />,
    },
    { title: '容量', dataIndex: 'capacity', width: 80 },
    {
      title: '时段与余量',
      key: 'slots',
      width: 220,
      render: (_, record) => (
        <div>
          <div className="text-slate-900">{record.slotCount} 个时段</div>
          <div className="mt-0.5 text-xs text-slate-400">
            可售 {record.availableCount}/{record.totalCapacity} · 已用 {record.usedCount}
            {record.lockedCount > 0 ? ` · 锁定 ${record.lockedCount}` : ''}
          </div>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 120,
      render: (_, record) => (
        <Switch
          size="small"
          checked={record.status === 1}
          checkedChildren="有效"
          unCheckedChildren="无效"
          loading={updateMutation.isPending && updateMutation.variables?.id === record.id}
          onChange={(checked) => handleToggleStatus(record, checked)}
        />
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      width: 180,
      render: (value: string) => formatDateTime(value),
    },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4}>
          <Button type="link" size="small" onClick={() => setSlotsTarget(record)}>
            时段
          </Button>
          <Button type="link" size="small" onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Button type="link" size="small" danger onClick={() => handleDelete(record)}>
            删除
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="排班管理"
        description="为资源设置可售窗口，保存后按拆分步长自动生成时段库存；已有预约占用的窗口仅能调整容量与状态。"
        extra={
          <Space>
            <Link to="/calendar">
              <Button>查看日历</Button>
            </Link>
            <Button onClick={() => setBatchOpen(true)}>批量排班</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              新增排班
            </Button>
          </Space>
        }
      />

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Space size={12} wrap>
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              className="w-[220px]"
              placeholder="全部资源"
              loading={resourcesLoading}
              options={resourceOptions}
              value={list.params.filters.resourceId || undefined}
              onChange={(value?: string) => list.setFilter('resourceId', value ?? '')}
            />
            <DatePicker.RangePicker
              value={rangeValue}
              placeholder={['开始日期', '结束日期']}
              onChange={(values) => {
                const [start, end] = values ?? []
                list.patch({
                  page: 1,
                  filters: {
                    startDate: start?.format('YYYY-MM-DD') ?? '',
                    endDate: end?.format('YYYY-MM-DD') ?? '',
                  },
                })
              }}
            />
            <Select
              allowClear
              className="w-[140px]"
              placeholder="全部状态"
              value={list.params.filters.status || undefined}
              options={STATUS_OPTIONS}
              onChange={(value?: string) => list.setFilter('status', value ?? '')}
            />
          </Space>
          <Button
            icon={<ReloadOutlined />}
            loading={list.isFetching && !list.isLoading}
            onClick={() => void list.refetch()}
          >
            刷新
          </Button>
        </div>

        <QueryBoundary
          loading={list.isLoading}
          error={list.error}
          onRetry={() => void list.refetch()}
        >
          <Table<Schedule>
            rowKey="id"
            size="middle"
            columns={columns}
            dataSource={list.data?.records ?? []}
            loading={list.isFetching && !list.isLoading}
            scroll={{ x: 1240 }}
            pagination={list.pagination}
            locale={{ emptyText: '暂无排班' }}
          />
        </QueryBoundary>
      </Card>

      <ScheduleFormDrawer open={formOpen} record={editing} onClose={() => setFormOpen(false)} />
      <BatchScheduleDrawer open={batchOpen} onClose={() => setBatchOpen(false)} />
      <ScheduleSlotsDrawer
        open={slotsTarget !== null}
        schedule={slotsTarget}
        onClose={() => setSlotsTarget(null)}
      />
    </div>
  )
}
