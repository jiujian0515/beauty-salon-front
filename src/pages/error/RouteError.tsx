import { Button, Result, Space } from 'antd'
import { useNavigate, useRouteError } from 'react-router'
import { errorMessage, isAppError } from '@/api/errors'

export function RouteError() {
  const error = useRouteError()
  const navigate = useNavigate()
  const traceId = isAppError(error) ? error.traceId : undefined

  return (
    <Result
      status="error"
      title="页面出错了"
      subTitle={errorMessage(error, '页面渲染失败，请重试')}
      extra={
        <Space>
          <Button type="primary" onClick={() => window.location.reload()}>
            重新加载
          </Button>
          <Button onClick={() => navigate('/', { replace: true })}>返回首页</Button>
        </Space>
      }
    >
      {traceId ? <p className="text-center text-xs text-slate-400">错误编号：{traceId}</p> : null}
    </Result>
  )
}
