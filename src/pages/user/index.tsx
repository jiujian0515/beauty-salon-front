import { PlusOutlined } from '@ant-design/icons'
import { App, Button, Card, Select, Space, Switch, Table, Tag, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useState } from 'react'
import { errorMessage } from '@/api/errors'
import type { SysUser, UserRole } from '@/api/user'
import { ListToolbar, PageHeader, QueryBoundary, ResetPasswordModal } from '@/components'
import { useRolesQuery } from '@/hooks/useRoles'
import { useSessionStore } from '@/stores/session'
import { formatDateTime } from '@/utils/datetime'
import { UserFormDrawer } from './components/UserFormDrawer'
import { useDeleteUser, useResetUserPassword, useUpdateUser, useUserListPage } from './hooks'

const ROLE_TAG_COLOR: Record<string, string> = {
  ADMIN: 'gold',
  STAFF: 'blue',
}

/** 管理员账号的角色、状态与删除均受后端保护 */
const isAdminAccount = (record: SysUser) => record.roles.some((role) => role.code === 'ADMIN')

export default function UserPage() {
  const { message, modal } = App.useApp()
  const currentUserId = useSessionStore((state) => state.user?.id)

  const list = useUserListPage()
  const rolesQuery = useRolesQuery()
  const updateMutation = useUpdateUser()
  const deleteMutation = useDeleteUser()
  const resetMutation = useResetUserPassword()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<SysUser | null>(null)
  const [resetTarget, setResetTarget] = useState<SysUser | null>(null)

  const roleOptions = (rolesQuery.data ?? []).map((role) => ({
    value: role.code,
    label: role.name,
  }))

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (record: SysUser) => {
    setEditing(record)
    setFormOpen(true)
  }

  const handleToggleStatus = (record: SysUser, enabled: boolean) => {
    const apply = () =>
      updateMutation.mutate(
        { id: record.id, payload: { status: enabled ? 1 : 0 } },
        {
          onSuccess: () => message.success(enabled ? '用户已启用' : '用户已停用'),
          onError: (err) => message.error(errorMessage(err)),
        },
      )

    if (enabled) {
      apply()
      return
    }

    modal.confirm({
      title: '停用用户',
      content: `停用后「${record.nickname || record.phone}」将无法登录，历史数据不受影响。`,
      okText: '确认停用',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: apply,
    })
  }

  const handleDelete = (record: SysUser) => {
    modal.confirm({
      title: '删除用户',
      content: `将删除「${record.nickname || record.phone}」，删除后该账号无法登录。此操作不可撤销。`,
      okText: '确认删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () =>
        deleteMutation
          .mutateAsync(record.id)
          .then(() => {
            message.success('用户已删除')
            list.handleDeleted()
          })
          .catch((err: unknown) => message.error(errorMessage(err))),
    })
  }

  const columns: ColumnsType<SysUser> = [
    { title: '姓名', dataIndex: 'nickname', width: 150, render: (value: string) => value || '—' },
    { title: '手机号', dataIndex: 'phone', width: 150 },
    {
      title: '角色',
      dataIndex: 'roles',
      width: 180,
      render: (roles: UserRole[]) =>
        roles.length === 0 ? (
          <span className="text-xs text-slate-400">—</span>
        ) : (
          <Space size={4} wrap>
            {roles.map((role) => (
              <Tag key={role.id} color={ROLE_TAG_COLOR[role.code] ?? 'default'}>
                {role.name}
              </Tag>
            ))}
          </Space>
        ),
    },
    // {
    //   title: '所属商户',
    //   dataIndex: 'merchantId',
    //   width: 110,
    //   render: (value: string | null) => (value ? value : '全局'),
    // },
    {
      title: '状态',
      dataIndex: 'status',
      width: 160,
      render: (_, record) => {
        const admin = isAdminAccount(record)
        return (
          <Space size={8}>
            <Tooltip title={admin ? '管理员账号不允许禁用' : undefined}>
              <span>
                <Switch
                  size="small"
                  checked={record.status === 1}
                  checkedChildren="启用"
                  unCheckedChildren="停用"
                  disabled={admin}
                  loading={updateMutation.isPending && updateMutation.variables?.id === record.id}
                  onChange={(checked) => handleToggleStatus(record, checked)}
                />
              </span>
            </Tooltip>
            {record.status === 1 ? null : <Tag>已停用</Tag>}
          </Space>
        )
      },
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
      render: (_, record) => {
        const admin = isAdminAccount(record)
        const locked = admin && record.id !== currentUserId
        return (
          <Space size={4}>
            <Tooltip title={locked ? '管理员账号只能由本人维护' : undefined}>
              <span>
                <Button type="link" size="small" disabled={locked} onClick={() => openEdit(record)}>
                  编辑
                </Button>
              </span>
            </Tooltip>
            <Tooltip title={locked ? '管理员账号只能由本人维护' : undefined}>
              <span>
                <Button
                  type="link"
                  size="small"
                  disabled={locked}
                  onClick={() => setResetTarget(record)}
                >
                  重置密码
                </Button>
              </span>
            </Tooltip>
            <Tooltip title={admin ? '管理员账号不允许删除' : undefined}>
              <span>
                <Button
                  type="link"
                  size="small"
                  danger
                  disabled={admin}
                  onClick={() => handleDelete(record)}
                >
                  删除
                </Button>
              </span>
            </Tooltip>
          </Space>
        )
      },
    },
  ]

  return (
    <div>
      <PageHeader
        title="用户管理"
        description="管理后台账号（管理员 / 员工），通过角色区分身份。顾客账号请在「顾客管理」中维护。"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新增用户
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
        >
          <Select
            allowClear
            className="w-[180px]"
            placeholder="全部角色"
            value={list.params.filters.role || undefined}
            loading={rolesQuery.isLoading}
            options={roleOptions}
            onChange={(value?: string) => list.setFilter('role', value ?? '')}
          />
        </ListToolbar>

        <QueryBoundary
          loading={list.isLoading}
          error={list.error}
          onRetry={() => void list.refetch()}
        >
          <Table<SysUser>
            rowKey="id"
            size="middle"
            columns={columns}
            dataSource={list.data?.records ?? []}
            loading={list.isFetching && !list.isLoading}
            scroll={{ x: 1000 }}
            pagination={list.pagination}
          />
        </QueryBoundary>
      </Card>

      <UserFormDrawer open={formOpen} record={editing} onClose={() => setFormOpen(false)} />

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
