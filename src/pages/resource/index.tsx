import { PlaceholderPage } from '@/components'

export default function ResourcePage() {
  return (
    <PlaceholderPage
      title="资源管理"
      description="维护技师与床位两类资源，停用前展示受影响排班与预约。"
      docSection="§10.6 资源管理"
      todos={[
        'Tab 分区：技师 / 床位',
        '新增/编辑表单，类型创建后不可修改',
        '停用与删除的二次确认 + 影响面提示',
        '写操作按 resource:write 权限渲染',
      ]}
    />
  )
}
