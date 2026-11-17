import { useParams } from 'react-router'
import { PlaceholderPage } from '@/components'

export default function ReservationDetailPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <PlaceholderPage
      title="预约详情"
      description={`预约号：${id ?? '—'} · 状态流转、支付流水与操作中心。`}
      docSection="§10.8 预约详情"
      todos={[
        '基本信息卡 + 状态时间线',
        '待支付 2 小时倒计时（以服务端 expiresAt 为准）',
        '核销（发起等待顾客确认 / 管理员代确认）',
        '取消与退款确认弹窗、定金流水摘要',
      ]}
    />
  )
}
