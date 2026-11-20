import { PlusOutlined } from '@ant-design/icons'
import { App, Button, Card, Select, Space, Switch, Table, Tabs } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useState } from 'react'
import { errorMessage } from '@/api/errors'
import type { Resource } from '@/api/resource'
import { toResourceType } from '@/api/resource'
import { ListToolbar, PageHeader, QueryBoundary } from '@/components'
import { RESOURCE_TYPE_META } from '@/constants/status'
import { RESOURCE_TYPE } from '@/types/domain'
import { formatDateTime } from '@/utils/datetime'
import { ResourceFormDrawer } from './components/ResourceFormDrawer'
import { useDeleteResource, useResourceListPage, useUpdateResource } from './hooks'

const TYPE_TABS = [
  { key: RESOURCE_TYPE.STAFF, label: '技师' },
  { key: RESOURCE_TYPE.ROOM, label: '床位' },
]

const STATUS_OPTIONS = [
  { value: '1', label: '启用中' },
  { value: '0', label: '已停用' },
]

export default function ResourcePage() {
  const { message, modal } = App.useApp()

  const list = useResourceListPage()
  const updateMutation = useUpdateResource()
  const deleteMutation = useDeleteResource()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Resource | null>(null)

  const activeType = toResourceType(list.params.filters.type)
  const typeLabel = RESOURCE_TYPE_META[activeType].label

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (record: Resource) => {
    setEditing(record)
    setFormOpen(true)
  }

  const handleToggleStatus = (record: Resource, enabled: boolean) => {
    const apply = () =>
      updateMutation.mutate(
        { id: record.id, payload: { status: enabled ? 1 : 0 } },
        {
          onSuccess: () => message.success(enabled ? '资源已启用' : '资源已停用'),
          onError: (err) => message.error(errorMessage(err)),
        },
      )

    if (enabled) {
      apply()
      return
    }

    modal.confirm({
      title: `停用${RESOURCE_TYPE_META[record.type].label}`,
      content: `停用后「${record.name}」将不再参与新的排班与预约，已有排班与预约不受影响，可随时重新启用。`,
      okText: '确认停用',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: apply,
    })
  }

  const handleDelete = (record: Resource) => {
    const label = RESOURCE_TYPE_META[record.type].label
    modal.confirm({
      title: `删除${label}`,
      content: `将删除「${record.name}」，删除后不可恢复；若该${label}已被排班、库存或预约引用，系统会拒绝删除。`,
      okText: '确认删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () =>
        deleteMutation
          .mutateAsync(record.id)
          .then(() => {
            message.success('资源已删除')
            list.handleDeleted()
          })
          .catch((err: unknown) => message.error(errorMessage(err))),
    })
  }

  const columns: ColumnsType<Resource> = [
    {
      title: '资源名称',
      dataIndex: 'name',
      width: 220,
      render: (value: string, record) => (
        <div>
          <div className="font-medium text-slate-900">{value}</div>
          <div className="mt-0.5 text-xs text-slate-400">
            {RESOURCE_TYPE_META[record.type].label}
          </div>
        </div>
      ),
    },
    ...(activeType === RESOURCE_TYPE.STAFF
      ? [
          {
            title: '绑定用户',
            key: 'boundUser',
            width: 200,
            render: (_: unknown, record: Resource) => (
              <div>
                <div className="text-slate-900">{record.userName || '—'}</div>
                {record.userPhone ? (
                  <div className="mt-0.5 text-xs text-slate-400">{record.userPhone}</div>
                ) : null}
              </div>
            ),
          } satisfies ColumnsType<Resource>[number],
        ]
      : []),
    {
      title: '状态',
      dataIndex: 'status',
      width: 120,
      render: (_, record) => (
        <Switch
          size="small"
          checked={record.status === 1}
          checkedChildren="启用"
          unCheckedChildren="停用"
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
        title="资源管理"
        description="维护技师与床位两类资源。技师需绑定本商户的非管理员账号；停用或删除前请确认相关排班与预约已妥善处理。"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新增{typeLabel}
          </Button>
        }
      />

      <Card>
        <Tabs
          activeKey={activeType}
          items={TYPE_TABS}
          onChange={(key) => list.setFilter('type', key)}
          className="mb-2"
        />

        <ListToolbar
          value={list.keywordDraft}
          onChange={list.setKeywordDraft}
          onSearch={list.search}
          onRefresh={() => void list.refetch()}
          refreshing={list.isFetching && !list.isLoading}
          placeholder={`搜索${typeLabel}名称`}
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
          <Table<Resource>
            rowKey="id"
            size="middle"
            columns={columns}
            dataSource={list.data?.records ?? []}
            loading={list.isFetching && !list.isLoading}
            scroll={{ x: 900 }}
            pagination={list.pagination}
            locale={{ emptyText: `暂无${typeLabel}` }}
          />
        </QueryBoundary>
      </Card>

      <ResourceFormDrawer
        open={formOpen}
        record={editing}
        defaultType={activeType}
        onClose={() => setFormOpen(false)}
      />
    </div>
  )
}
