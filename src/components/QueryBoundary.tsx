import { Alert, Button, Empty, Skeleton } from 'antd'
import type { ReactNode } from 'react'
import { errorMessage } from '@/api/errors'

export interface QueryBoundaryProps {
  loading?: boolean
  error?: unknown
  empty?: boolean
  emptyText?: ReactNode
  onRetry?: () => void
  children: ReactNode
}

/** 加载 / 错误 / 空 三态统一出口（BTD §12.1） */
export function QueryBoundary({
  loading,
  error,
  empty,
  emptyText = '暂无数据',
  onRetry,
  children,
}: QueryBoundaryProps) {
  if (loading) return <Skeleton active paragraph={{ rows: 6 }} />

  if (error) {
    return (
      <Alert
        type="error"
        showIcon
        message={errorMessage(error, '加载失败，请稍后重试')}
        action={
          onRetry ? (
            <Button size="small" onClick={onRetry}>
              重试
            </Button>
          ) : null
        }
      />
    )
  }

  if (empty) return <Empty description={emptyText} />

  return <>{children}</>
}
