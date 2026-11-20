import { PlusOutlined } from '@ant-design/icons'
import { App, Button, Card, Space, Switch, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useState } from 'react'
import type { Customer } from '@/api/customer'
import { errorMessage } from '@/api/errors'
import { ListToolbar, PageHeader, QueryBoundary, ResetPasswordModal } from '@/components'
import { formatDateTime } from '@/utils/datetime'
import { CustomerFormDrawer } from './components/CustomerFormDrawer'
import {
  useCustomerListPage,
  useDeleteCustomer,
  useResetCustomerPassword,
  useUpdateCustomer,
} from './hooks'

export default function CustomerPage() {
  const { message, modal } = App.useApp()

  const list = useCustomerListPage()
  const updateMutation = useUpdateCustomer()
  const deleteMutation = useDeleteCustomer()
  const resetMutation = useResetCustomerPassword()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)
  const [resetTarget, setResetTarget] = useState<Customer | null>(null)

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (record: Customer) => {
    setEditing(record)
    setFormOpen(true)
  }

  const handleToggleStatus = (record: Customer, enabled: boolean) => {
    const apply = () =>
      updateMutation.mutate(
        { id: record.id, payload: { status: enabled ? 1 : 0 } },
        {
          onSuccess: () => message.success(enabled ? '顾客已启用' : '顾客已停用'),
          onError: (err) => message.error(errorMessage(err)),
        },
      )

    if (enabled) {
      apply()
      return
    }

    modal.confirm({
      title: '停用顾客',
      content: `停用后「${record.nickname || record.phone}」将无法登录顾客端，历史预约与消费记录不受影响。`,
      okText: '确认停用',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: apply,
    })
  }

  const handleDelete = (record: Customer) => {
    modal.confirm({
      title: '删除顾客',
      content: `将删除「${record.nickname || record.phone}」，删除后该账号无法登录，手机号可重新注册。此操作不可撤销。`,
      okText: '确认删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () =>
        deleteMutation
          .mutateAsync(record.id)
          .then(() => {
            message.success('顾客已删除')
            list.handleDeleted()
          })
          .catch((err: unknown) => message.error(errorMessage(err))),
    })
  }

  const columns: ColumnsType<Customer> = [
    { title: '姓名', dataIndex: 'nickname', width: 180, render: (value: string) => value || '—' },
    { title: '手机号', dataIndex: 'phone', width: 160 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 160,
      render: (_, record) => (
        <Space size={8}>
          <Switch
            size="small"
            checked={record.status === 1}
            checkedChildren="启用"
            unCheckedChildren="停用"
            loading={updateMutation.isPending && updateMutation.variables?.id === record.id}
            onChange={(checked) => handleToggleStatus(record, checked)}
          />
          {record.status === 1 ? null : <Tag>已停用</Tag>}
        </Space>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 180,
      render: (value: string) => formatDateTime(value),
    },
    {
      title: '操作',
      key: 'actions',
      width: 230,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4}>
          <Button type="link" size="small" onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Button type="link" size="small" onClick={() => setResetTarget(record)}>
            重置密码
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
        title="顾客管理"
        description="维护顾客账号（独立于后台员工账号）。顾客可在顾客端自助注册，也可由后台新增；账号全局共享，不绑定商户。"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新增顾客
          </Button>
        }
      />

      <Card>
        <ListToolbar
          value={list.keywordDraft}
          onChange={list.setKeywordDraft}
          onSearch={list.search}
          onRefresh={() => void list.refetch()}
          refreshing={list.isFetching && !list.isLoading}
          placeholder="搜索姓名或手机号"
        />

        <QueryBoundary
          loading={list.isLoading}
          error={list.error}
          onRetry={() => void list.refetch()}
        >
          <Table<Customer>
            rowKey="id"
            size="middle"
            columns={columns}
            dataSource={list.data?.records ?? []}
            loading={list.isFetching && !list.isLoading}
            scroll={{ x: 900 }}
            pagination={list.pagination}
            locale={{ emptyText: '暂无顾客' }}
          />
        </QueryBoundary>
      </Card>

      <CustomerFormDrawer open={formOpen} record={editing} onClose={() => setFormOpen(false)} />

      <ResetPasswordModal
        open={resetTarget !== null}
        subject={resetTarget ? resetTarget.nickname || resetTarget.phone : ''}
        onSubmit={(newPassword) =>
          resetMutation.mutateAsync({ id: resetTarget?.id ?? '', newPassword })
        }
        onClose={() => setResetTarget(null)}
      />
    </div>
  )
}
