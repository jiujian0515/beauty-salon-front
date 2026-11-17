import { PlaceholderPage } from '@/components'

export default function DepositPage() {
  return (
    <PlaceholderPage
      title="定金流水"
      description="查询定金收取与退款记录，支持按状态、日期与预约号检索。"
      docSection="§10.10 定金流水"
      todos={[
        '筛选 + 期间小计（收款 / 退款 / 净额，整数分汇总）',
        '表格：流水号、预约号、金额、状态、支付与退款时间',
        '行展开关联预约摘要',
        '只读，不提供手动改状态',
      ]}
    />
  )
}
