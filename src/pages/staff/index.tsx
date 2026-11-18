import { PlaceholderPage } from '@/components'

export default function StaffPage() {
  return (
    <PlaceholderPage
      title="员工管理"
      description="管理员维护员工账号（手机号即登录账号）、姓名与启用状态；员工的角色固定为「员工」。"
      docSection="§10.11 员工管理"
      todos={[
        '列表：姓名、手机号、状态、创建时间（GET /admin/staff 分页）',
        '新增员工：手机号（1[3-9] 开头的 11 位）、初始密码（6-32 位）、姓名',
        '编辑员工：手机号、姓名、状态（局部更新，不传即不改）',
        '重置密码：独立入口，成功后提示「已重置，请告知员工」',
        '禁止停用自己；删除为逻辑删除，需二次确认',
        '角色分配不在此页：角色及其权限范围在「角色管理」页查看与维护',
      ]}
    />
  )
}
