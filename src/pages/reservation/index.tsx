import { PlaceholderPage } from '@/components'

export default function ReservationListPage() {
  return (
    <PlaceholderPage
      title="预约单"
      description="按状态、日期、资源、服务检索预约，处理核销与取消。"
      docSection="§10.7 预约列表"
      todos={[
        '筛选与快捷 Tab（待支付 / 待服务 / 待确认 / 已完成）',
        '表格固定表头 + 操作列固定，筛选同步 URL',
        '行内核销 / 取消（按状态映射与权限渲染）',
        '手机号脱敏展示，预约号可复制',
      ]}
    />
  )
}
