import { PlusOutlined } from '@ant-design/icons'
import { App, Button, Card, Space, Table, Tag, Tooltip, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useState } from 'react'
import { errorMessage } from '@/api/errors'
import type { Role } from '@/api/role'
import { PageHeader, QueryBoundary } from '@/components'
import {
  PERMISSION_LABELS,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  ROLE_PERMISSIONS,
} from '@/constants/permissions'
import type { Permission, Role as RoleCode } from '@/constants/permissions'
import { useRolesQuery } from '@/hooks/useRoles'
import { formatDateTime } from '@/utils/datetime'
import { RoleFormDrawer } from './components/RoleFormDrawer'
import { useDeleteRole } from './hooks'

/** 内置角色不允许删除：删除后登录与权限判定都会失去依据 */
const BUILT_IN_CODES = new Set(['ADMIN'])

const BUILT_IN_ROLE_ROWS = (Object.keys(ROLE_PERMISSIONS) as RoleCode[]).map((role) => ({
  role,
  name: ROLE_LABELS[role],
  description: ROLE_DESCRIPTIONS[role],
  permissions: ROLE_PERMISSIONS[role],
}))

const permissionColumns: ColumnsType<(typeof BUILT_IN_ROLE_ROWS)[number]> = [
  {
    title: '角色',
    dataIndex: 'name',
    width: 120,
    render: (_, row) => <Tag color={row.role === 'ADMIN' ? 'gold' : 'blue'}>{row.name}</Tag>,
  },
  { title: '说明', dataIndex: 'description', width: 320 },
  {
    title: '可用权限',
    dataIndex: 'permissions',
    render: (permissions: readonly Permission[]) => (
      <div className="flex flex-wrap gap-1">
        {permissions.map((permission) => (
          <Tag key={permission}>{PERMISSION_LABELS[permission]}</Tag>
        ))}
      </div>
    ),
  },
]

export default function RolePage() {
  const { message, modal } = App.useApp()

  const rolesQuery = useRolesQuery()
  const deleteMutation = useDeleteRole()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Role | null>(null)

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (record: Role) => {
    setEditing(record)
    setFormOpen(true)
  }

  const handleDelete = (record: Role) => {
    modal.confirm({
      title: '删除角色',
      content: `将删除角色「${record.name}（${record.code}）」。若该角色下仍有用户，删除会被拒绝。`,
      okText: '确认删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () =>
        deleteMutation
          .mutateAsync(record.id)
          .then(() => message.success('角色已删除'))
          .catch((err: unknown) => message.error(errorMessage(err))),
    })
  }

  const columns: ColumnsType<Role> = [
    { title: '角色名称', dataIndex: 'name', width: 180 },
    {
      title: '角色代码',
      dataIndex: 'code',
      width: 180,
      render: (code: string) => (
        <Space size={6}>
          <Tag color="default">{code}</Tag>
          {BUILT_IN_CODES.has(code) ? <span className="text-xs text-slate-400">内置</span> : null}
        </Space>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 200,
      render: (value: string) => formatDateTime(value),
    },
    {
      title: '操作',
      key: 'actions',
      width: 160,
      fixed: 'right',
      render: (_, record) => {
        const builtIn = BUILT_IN_CODES.has(record.code)
        return (
          <Space size={4}>
            <Tooltip title={builtIn ? '管理员不可编辑' : undefined}>
              <Button type="link" size="small" disabled={builtIn} onClick={() => openEdit(record)}>
                编辑
              </Button>
            </Tooltip>
            <Tooltip title={builtIn ? '管理员不可删除' : undefined}>
              <Button
                type="link"
                size="small"
                danger
                disabled={builtIn}
                onClick={() => handleDelete(record)}
              >
                删除
              </Button>
            </Tooltip>
          </Space>
        )
      },
    },
  ]

  return (
    <div>
      <PageHeader
        title="角色管理"
        description="维护角色字典。账号归属哪些角色在「用户」页维护。"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新增角色
          </Button>
        }
      />

      <Card>
        <QueryBoundary
          loading={rolesQuery.isLoading}
          error={rolesQuery.error}
          onRetry={() => void rolesQuery.refetch()}
        >
          <Table<Role>
            rowKey="id"
            size="middle"
            columns={columns}
            dataSource={rolesQuery.data ?? []}
            loading={rolesQuery.isFetching && !rolesQuery.isLoading}
            pagination={false}
          />
        </QueryBoundary>
      </Card>

      <Card className="mt-4">
        <Typography.Title level={5} className="!mb-1">
          内置角色的权限范围
        </Typography.Title>
        <Typography.Paragraph type="secondary" className="!mb-4 text-sm">
          权限点由前端常量定义（与 PRD §3 一致），后端目前仅按角色代码做粗粒度校验；
          新增的自定义角色在权限矩阵中默认为只读，接入角色权限接口后可在此配置。
        </Typography.Paragraph>
        <Table
          rowKey="role"
          size="small"
          columns={permissionColumns}
          dataSource={BUILT_IN_ROLE_ROWS}
          pagination={false}
        />
      </Card>

      <RoleFormDrawer open={formOpen} record={editing} onClose={() => setFormOpen(false)} />
    </div>
  )
}
