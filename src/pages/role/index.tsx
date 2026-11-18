import { Alert, Card, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { PageHeader } from '@/components'
import {
  PERMISSION_LABELS,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  ROLE_PERMISSIONS,
} from '@/constants/permissions'
import type { Permission, Role } from '@/constants/permissions'

interface RoleRow {
  role: Role
  name: string
  description: string
  permissions: readonly Permission[]
}

const ROLE_ROWS: RoleRow[] = (Object.keys(ROLE_PERMISSIONS) as Role[]).map((role) => ({
  role,
  name: ROLE_LABELS[role],
  description: ROLE_DESCRIPTIONS[role],
  permissions: ROLE_PERMISSIONS[role],
}))

const columns: ColumnsType<RoleRow> = [
  {
    title: '角色',
    dataIndex: 'name',
    width: 160,
    render: (_, row) => (
      <div className="flex flex-col gap-1">
        <Tag color={row.role === 'ADMIN' ? 'gold' : 'blue'} className="w-fit">
          {row.name}
        </Tag>
        <span className="text-xs text-slate-400">{row.role}</span>
      </div>
    ),
  },
  {
    title: '说明',
    dataIndex: 'description',
    width: 320,
  },
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
  return (
    <div>
      <PageHeader
        title="角色管理"
        description="维护商户后台的角色及其可用权限；员工归属哪个角色在「员工」页维护。"
      />
      <Card>
        <div className="flex flex-col gap-4">
          <Alert
            type="info"
            showIcon
            message="角色权限当前由前端常量定义，只读展示"
            description="后端尚未提供角色维护接口，因此本期展示 PRD §3 确定的角色与权限矩阵；接口就绪后在此页开启新增/编辑。"
          />
          <Table<RoleRow>
            rowKey="role"
            size="middle"
            columns={columns}
            dataSource={ROLE_ROWS}
            pagination={false}
          />
        </div>
      </Card>
    </div>
  )
}
