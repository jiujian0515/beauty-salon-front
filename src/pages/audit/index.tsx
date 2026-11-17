import { PlaceholderPage } from '@/components'

export default function AuditLogPage() {
  return (
    <PlaceholderPage
      title="审计日志"
      description="只读查询关键操作留痕：下单、核销、取消、退款、锁定、排班与服务变更。"
      docSection="§10.12 审计日志"
      todos={[
        '筛选：动作类型、日期区间、操作人',
        '表格 + 详情抽屉（结构化字段）',
        '动作类型枚举与后端 audit_log 对齐',
      ]}
    />
  )
}
