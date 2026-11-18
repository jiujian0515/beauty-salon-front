import { PlusOutlined } from '@ant-design/icons'
import { App, Button, Card, Select, Space, Switch, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useState } from 'react'
import { errorMessage } from '@/api/errors'
import type { ServiceItem } from '@/api/serviceItem'
import { DurationText, ListToolbar, MoneyText, PageHeader, QueryBoundary } from '@/components'
import { PERMISSIONS } from '@/constants/permissions'
import { usePermission } from '@/hooks/usePermission'
import { formatDateTime } from '@/utils/datetime'
import { ServiceItemFormDrawer } from './components/ServiceItemFormDrawer'
import { useDeleteServiceItem, useServiceItemListPage, useUpdateServiceItem } from './hooks'

const STATUS_OPTIONS = [
  { value: '1', label: '上架中' },
  { value: '0', label: '已下架' },
]

export default function ServicePage() {
  const { message, modal } = App.useApp()
  const canManage = usePermission(PERMISSIONS.SERVICE_WRITE)

  const list = useServiceItemListPage()
  const updateMutation = useUpdateServiceItem()
  const deleteMutation = useDeleteServiceItem()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<ServiceItem | null>(null)

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (record: ServiceItem) => {
    setEditing(record)
    setFormOpen(true)
  }

  const handleToggleStatus = (record: ServiceItem, enabled: boolean) => {
    const apply = () =>
      updateMutation.mutate(
        { id: record.id, payload: { status: enabled ? 1 : 0 } },
        {
          onSuccess: () => message.success(enabled ? '服务已上架' : '服务已下架'),
          onError: (err) => message.error(errorMessage(err)),
        },
      )

    if (enabled) {
      apply()
      return
    }

    modal.confirm({
      title: '下架服务项目',
      content: `下架后「${record.name}」将不在顾客端展示，既有预约不受影响。`,
      okText: '确认下架',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: apply,
    })
  }

  const handleDelete = (record: ServiceItem) => {
    modal.confirm({
      title: '删除服务项目',
      content: `将删除「${record.name}」，删除后不可恢复，顾客端不再展示该服务。`,
      okText: '确认删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () =>
        deleteMutation
          .mutateAsync(record.id)
          .then(() => {
            message.success('服务项目已删除')
            list.handleDeleted()
          })
          .catch((err: unknown) => message.error(errorMessage(err))),
    })
  }

  const columns: ColumnsType<ServiceItem> = [
    {
      title: '服务名称',
      dataIndex: 'name',
      width: 220,
      render: (value: string, record) => (
        <div>
          <div className="font-medium text-slate-900">{value}</div>
          {record.description ? (
            <div className="mt-0.5 text-xs text-slate-400">{record.description}</div>
          ) : null}
        </div>
      ),
    },
    {
      title: '时长',
      dataIndex: 'durationMinutes',
      width: 110,
      render: (value: number) => <DurationText minutes={value} />,
    },
    {
      title: '价格',
      dataIndex: 'priceCents',
      width: 120,
      render: (value: number) => <MoneyText value={value} />,
    },
    {
      title: '定金',
      dataIndex: 'depositCents',
      width: 120,
      render: (value: number) => <MoneyText value={value} />,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 120,
      render: (_, record) => (
        <Switch
          size="small"
          checked={record.status === 1}
          checkedChildren="上架"
          unCheckedChildren="下架"
          disabled={!canManage}
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
      width: 140,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4}>
          <Button type="link" size="small" disabled={!canManage} onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger
            disabled={!canManage}
            onClick={() => handleDelete(record)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="服务项目"
        description="维护服务名称、时长、价格与定金，控制上下架。价格与定金的修改不影响已创建预约。"
        extra={
          canManage ? (
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              新增服务项目
            </Button>
          ) : null
        }
      />

      <Card>
        <ListToolbar
          value={list.keywordDraft}
          onChange={list.setKeywordDraft}
          onSearch={list.search}
          onRefresh={() => void list.refetch()}
          refreshing={list.isFetching && !list.isLoading}
          placeholder="搜索服务名称或描述"
        >
          <Select
            allowClear
            className="w-[160px]"
            placeholder="全部状态"
            value={list.params.filters.status || undefined}
            options={STATUS_OPTIONS}
            onChange={(value?: string) => list.setFilter('status', value ?? '')}
          />
        </ListToolbar>

        <QueryBoundary
          loading={list.isLoading}
          error={list.error}
          onRetry={() => void list.refetch()}
        >
          <Table<ServiceItem>
            rowKey="id"
            size="middle"
            columns={columns}
            dataSource={list.data?.records ?? []}
            loading={list.isFetching && !list.isLoading}
            scroll={{ x: 1000 }}
            pagination={list.pagination}
            locale={{ emptyText: '暂无服务项目' }}
          />
        </QueryBoundary>
      </Card>

      <ServiceItemFormDrawer
        open={formOpen}
        record={editing}
        onClose={() => setFormOpen(false)}
      />
    </div>
  )
}
