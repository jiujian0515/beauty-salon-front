import { Button, Result } from 'antd'
import { useNavigate } from 'react-router'

export function Forbidden() {
  const navigate = useNavigate()
  return (
    <Result
      status="403"
      title="403"
      subTitle="当前账号无此页面权限，如需访问请联系商户管理员。"
      extra={
        <Button type="primary" onClick={() => navigate('/calendar', { replace: true })}>
          返回日历
        </Button>
      }
    />
  )
}
