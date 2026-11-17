import { PlaceholderPage } from '@/components'

export default function DashboardPage() {
  return (
    <PlaceholderPage
      title="今日概览"
      description="今日预约数、待到店、已完成、定金收入，以及余量紧张时段与待处理清单。"
      docSection="§10.2 工作台"
      todos={[
        '四项指标卡（金额为整数分汇总后格式化）',
        '余量紧张时段列表（跳转日历）',
        '待支付 / 待确认核销清单',
        '60 秒轮询与联动失效',
      ]}
    />
  )
}
