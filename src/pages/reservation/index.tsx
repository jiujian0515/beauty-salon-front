import { App, Button, Card, DatePicker, Space, Table, Tabs, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { Dayjs } from 'dayjs'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import type { ReservationAdmin } from '@/api/reservation'
import { ListToolbar, MoneyText, PageHeader, QueryBoundary, StatusTag } from '@/components'
import { RESOURCE_TYPE_META, SERVICE_CATEGORY_META } from '@/constants/status'
import { RESERVATION_STATUS, isServiceCategory } from '@/types/domain'
import { dayjs, formatDateTime } from '@/utils/datetime'
import { maskPhone } from '@/utils/format'
import { VerifyReservationModal } from './components/VerifyReservationModal'
import { useReservationListPage } from './hooks'

const STATUS_TABS = [
  { key: '', label: '全部' },
  { key: RESERVATION_STATUS.PENDING_PAYMENT, label: '待支付' },
  { key: RESERVATION_STATUS.CONFIRMED, label: '待服务' },
  { key: RESERVATION_STATUS.COMPLETED, label: '已完成' },
  { key: RESERVATION_STATUS.CANCELLED, label: '已取消' },
  { key: RESERVATION_STATUS.REFUNDED, label: '已退款' },
]

function categoryLabel(code: string): string {
  return isServiceCategory(code) ? SERVICE_CATEGORY_META[code].label : code
}

export default function ReservationListPage() {
  const { message } = App.useApp()
  const navigate = useNavigate()
  const list = useReservationListPage()
  const [verifyOpen, setVerifyOpen] = useState(false)

  const { startDate, endDate } = list.params.filters
  const rangeValue: [Dayjs, Dayjs] | null =
    startDate && endDate ? [dayjs(startDate), dayjs(endDate)] : null

  const applyRange = (range: [Dayjs | null, Dayjs | null] | null) => {
    list.patch({
      filters: {
        startDate: range?.[0]?.format('YYYY-MM-DD') ?? '',
        endDate: range?.[1]?.format('YYYY-MM-DD') ?? '',
      },
      page: 1,
    })
  }

  const copyVerifyCode = (record: ReservationAdmin) => {
    if (!record.verifyCode) {
      message.warning('该预约当前无核销码')
      return
    }
    void navigator.clipboard
      .writeText(record.verifyCode)
      .then(() => message.success(`核销码 ${record.verifyCode} 已复制`))
      .catch(() => message.error('复制失败，请手动选择文本'))
  }

  const columns: ColumnsType<ReservationAdmin> = [
    {
      title: '预约单',
      dataIndex: 'reservationNo',
      width: 200,
      render: (value: string, record) => (
        <div>
          <div className="font-medium text-slate-900">{value}</div>
          {record.verifyCode ? (
            <button
              type="button"
              className="mt-0.5 cursor-pointer text-xs text-slate-400 hover:text-slate-600"
              onClick={() => copyVerifyCode(record)}
            >
              核销码 {record.verifyCode}（点击复制）
            </button>
          ) : (
            <div className="mt-0.5 text-xs text-slate-400">—</div>
          )}
        </div>
      ),
    },
    {
      title: '顾客',
      key: 'customer',
      width: 160,
      render: (_, record) => (
        <div>
          <div className="text-slate-900">{record.customerNickname || '—'}</div>
          <div className="mt-0.5 text-xs text-slate-400">{maskPhone(record.customerPhone)}</div>
        </div>
      ),
    },
    {
      title: '服务项目',
      key: 'service',
      width: 220,
      render: (_, record) => (
        <div>
          <div className="text-slate-900">{record.serviceItemName || '—'}</div>
          <div className="mt-0.5 text-xs text-slate-400">
            {`${record.serviceItemCategory ? categoryLabel(record.serviceItemCategory) : '未分类'}${record.serviceItemDurationMinutes ? ` · ${record.serviceItemDurationMinutes} 分钟` : ''}${record.isCourse ? ' · 疗程' : ''}`}
          </div>
        </div>
      ),
    },
    {
      title: '资源',
      key: 'resource',
      width: 130,
      render: (_, record) =>
        record.resourceName ? (
          <div>
            <div className="text-slate-900">{record.resourceName}</div>
            <div className="mt-0.5 text-xs text-slate-400">
              {record.resourceType ? RESOURCE_TYPE_META[record.resourceType].label : '—'}
            </div>
          </div>
        ) : (
          '—'
        ),
    },
    {
      title: '预约时间',
      dataIndex: 'appointmentTime',
      width: 170,
      render: (value: string) => formatDateTime(value),
    },
    {
      title: '定金',
      dataIndex: 'depositCents',
      width: 110,
      render: (value: number, record) =>
        record.isCourse ? <Tag>免定金</Tag> : <MoneyText value={value} />,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 110,
      render: (_, record) => <StatusTag kind="reservation" value={record.status} />,
    },
    {
      title: '下单时间',
      dataIndex: 'createdAt',
      width: 170,
      render: (value: string) => formatDateTime(value),
    },
    {
      title: '操作',
      key: 'actions',
      width: 130,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4}>
          <Button type="link" size="small" onClick={() => navigate(`/reservations/${record.id}`)}>
            详情
          </Button>
          {record.status === RESERVATION_STATUS.CONFIRMED ? (
            <Button type="link" size="small" onClick={() => setVerifyOpen(true)}>
              核销
            </Button>
          ) : null}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="预约单"
        description="按状态、预约日期与关键字（预约号 / 核销码 / 顾客手机号或昵称）检索预约，到店后核销。核销仅限「待服务」的预约。"
        extra={
          <Button type="primary" onClick={() => setVerifyOpen(true)}>
            核销预约
          </Button>
        }
      />

      <Card>
        <Tabs
          activeKey={list.params.filters.status ?? ''}
          items={STATUS_TABS}
          onChange={(key) => list.setFilter('status', key)}
          className="mb-2"
        />

        <ListToolbar
          value={list.keywordDraft}
          onChange={list.setKeywordDraft}
          onSearch={list.search}
          onRefresh={() => void list.refetch()}
          refreshing={list.isFetching && !list.isLoading}
          placeholder="搜索预约号、核销码、顾客手机号或昵称"
        >
          <DatePicker.RangePicker
            value={rangeValue}
            onChange={applyRange}
            allowEmpty={[true, true]}
            placeholder={['预约开始日期', '预约结束日期']}
          />
        </ListToolbar>

        <QueryBoundary
          loading={list.isLoading}
          error={list.error}
          onRetry={() => void list.refetch()}
        >
          <Table<ReservationAdmin>
            rowKey="id"
            size="middle"
            columns={columns}
            dataSource={list.data?.records ?? []}
            loading={list.isFetching && !list.isLoading}
            scroll={{ x: 1400 }}
            pagination={list.pagination}
            locale={{ emptyText: '暂无预约单' }}
          />
        </QueryBoundary>
      </Card>

      <VerifyReservationModal
        open={verifyOpen}
        onSuccess={() => void list.refetch()}
        onClose={() => setVerifyOpen(false)}
      />
    </div>
  )
}
