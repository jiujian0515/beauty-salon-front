import { PlaceholderPage } from '@/components'

export default function ServicePage() {
  return (
    <PlaceholderPage
      title="服务项目"
      description="维护服务名称、时长、价格与定金，控制上下架。"
      docSection="§10.5 服务项目"
      todos={[
        '列表：名称、时长、价格、定金、状态开关',
        '新增/编辑抽屉表单（金额以元录入、转整数分存储）',
        '上下架确认与影响说明（不影响既有预约）',
        '写操作按 service:write 权限渲染',
      ]}
    />
  )
}
