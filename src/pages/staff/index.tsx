import { PlaceholderPage } from '@/components'

export default function StaffPage() {
  return (
    <PlaceholderPage
      title="员工与角色"
      description="管理员维护员工账号、角色与启用状态。"
      docSection="§10.11 员工与角色"
      todos={[
        '员工列表：姓名、账号、角色、状态、最后登录',
        '新增/编辑抽屉（角色仅 STAFF / ADMIN）',
        '禁止停用自己、禁止降级最后一个管理员',
        '重置密码后的提示与确认',
      ]}
    />
  )
}
