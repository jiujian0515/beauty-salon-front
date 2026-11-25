import { ArrowLeftOutlined } from '@ant-design/icons'
import { App, Button, Card, Descriptions, Space, Timeline } from 'antd'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { MoneyText, PageHeader, QueryBoundary, StatusTag } from '@/components'
import { RESOURCE_TYPE_META, SERVICE_CATEGORY_META } from '@/constants/status'
import { RESERVATION_STATUS, isServiceCategory } from '@/types/domain'
import { formatDateTime } from '@/utils/datetime'
import { maskPhone, orDash } from '@/utils/format'
import { VerifyReservationModal } from './components/VerifyReservationModal'
import { useReservationDetail } from './hooks'

export default function ReservationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { message } = App.useApp()
  const detail = useReservationDetail(id ?? null)
  const [verifyOpen, setVerifyOpen] = useState(false)

  const record = detail.data

  const copyVerifyCode = () => {
    if (!record?.verifyCode) {
      message.warning('该预约当前无核销码')
      return
    }
    void navigator.clipboard
      .writeText(record.verifyCode)
      .then(() => message.success(`核销码 ${record.verifyCode} 已复制`))
      .catch(() => message.error('复制失败，请手动选择文本'))
  }

  const timelineItems = record
    ? [
        { label: '下单', value: record.createdAt },
        { label: '支付定金', value: record.paidAt },
        { label: '取消', value: record.cancelledAt },
        { label: '核销', value: record.verifiedAt },
      ]
        .filter((item) => item.value)
        .map((item) => ({
          color: item.label === '核销' ? 'green' : item.label === '取消' ? 'red' : 'blue',
          children: (
            <div>
              <div className="text-slate-900">{item.label}</div>
              <div className="text-xs text-slate-400">{formatDateTime(item.value)}</div>
            </div>
          ),
        }))
    : []

  return (
    <div>
      <PageHeader
        title="预约详情"
        description="查看预约状态流转与支付信息；到店核销仅限「待服务」的预约。"
        extra={
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/reservations')}>
              返回列表
            </Button>
            {record?.status === RESERVATION_STATUS.CONFIRMED ? (
              <Button type="primary" onClick={() => setVerifyOpen(true)}>
                核销
              </Button>
            ) : null}
          </Space>
        }
      />

      <QueryBoundary
        loading={detail.isLoading}
        error={detail.error}
        onRetry={() => void detail.refetch()}
      >
        {record ? (
          <div className="flex flex-col gap-4">
            <Card
              title={
                <Space size={8}>
                  <span>{record.reservationNo}</span>
                  <StatusTag kind="reservation" value={record.status} />
                </Space>
              }
              extra={
                record.verifyCode ? (
                  <Button type="link" onClick={copyVerifyCode}>
                    核销码 {record.verifyCode}（点击复制）
                  </Button>
                ) : null
              }
            >
              <Descriptions column={2} size="middle" bordered>
                <Descriptions.Item label="顾客">
                  {`${record.customerNickname || '—'} · ${maskPhone(record.customerPhone)}`}
                </Descriptions.Item>
                <Descriptions.Item label="预约时间">
                  {formatDateTime(record.appointmentTime)}
                </Descriptions.Item>
                <Descriptions.Item label="服务项目">
                  {orDash(record.serviceItemName)}
                </Descriptions.Item>
                <Descriptions.Item label="服务分类">
                  {record.serviceItemCategory
                    ? isServiceCategory(record.serviceItemCategory)
                      ? SERVICE_CATEGORY_META[record.serviceItemCategory].label
                      : record.serviceItemCategory
                    : '未分类'}
                </Descriptions.Item>
                <Descriptions.Item label="服务时长">
                  {record.serviceItemDurationMinutes
                    ? `${record.serviceItemDurationMinutes} 分钟`
                    : '—'}
                </Descriptions.Item>
                <Descriptions.Item label="服务价格">
                  {record.serviceItemPriceCents === null ? (
                    '—'
                  ) : (
                    <MoneyText value={record.serviceItemPriceCents} />
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="技师 / 资源">
                  {record.resourceName
                    ? `${record.resourceName}${
                        record.resourceType
                          ? `（${RESOURCE_TYPE_META[record.resourceType].label}）`
                          : ''
                      }`
                    : '—'}
                </Descriptions.Item>
                <Descriptions.Item label="定金">
                  {record.isCourse ? (
                    '免定金（疗程预约）'
                  ) : (
                    <MoneyText value={record.depositCents} />
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="下单时间">
                  {formatDateTime(record.createdAt)}
                </Descriptions.Item>
                <Descriptions.Item label="核销时间">
                  {record.verifiedAt ? formatDateTime(record.verifiedAt) : '—'}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title="状态流转">
              {timelineItems.length ? (
                <Timeline items={timelineItems} />
              ) : (
                <span className="text-slate-400">暂无流转记录</span>
              )}
            </Card>
          </div>
        ) : null}
      </QueryBoundary>

      <VerifyReservationModal
        open={verifyOpen}
        onSuccess={() => void detail.refetch()}
        onClose={() => setVerifyOpen(false)}
      />
    </div>
  )
}
