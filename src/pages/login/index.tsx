import { LockOutlined, UserOutlined } from '@ant-design/icons'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Alert, Button, Card, Input, Typography } from 'antd'
import { Controller, useForm } from 'react-hook-form'
import { Navigate, useNavigate, useSearchParams } from 'react-router'
import { login } from '@/api/auth'
import { errorMessage } from '@/api/errors'
import { env } from '@/config/env'
import { useSessionStore } from '@/stores/session'
import { loginSchema } from './schema'
import type { LoginForm } from './schema'

/** 登录回跳只允许站内相对路径，防开放重定向（BTD §7.2） */
const SAFE_REDIRECT = /^\/(?!\/)/

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = useSessionStore((state) => state.token)
  const setSession = useSessionStore((state) => state.setSession)

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { account: '', password: '' },
  })

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: ({ token: nextToken, user }) => {
      setSession({ token: nextToken, user })
      const rawRedirect = searchParams.get('redirect')
      const target = rawRedirect && SAFE_REDIRECT.test(rawRedirect) ? rawRedirect : '/calendar'
      navigate(target, { replace: true })
    },
  })

  if (token) {
    return <Navigate to="/calendar" replace />
  }

  return (
    <Card className="w-full max-w-[400px] shadow-sm">
      <div className="mb-6 text-center">
        <Typography.Title level={3} className="!mb-1">
          美容院商户后台
        </Typography.Title>
        <Typography.Text type="secondary">登录后管理排班、预约与定金</Typography.Text>
      </div>

      <form
        className="flex flex-col gap-4"
        onSubmit={handleSubmit((values) => mutation.mutate(values))}
      >
        <label className="block">
          <span className="mb-1 block text-sm text-slate-700">账号</span>
          <Controller
            control={control}
            name="account"
            render={({ field, fieldState }) => (
              <Input
                size="large"
                prefix={<UserOutlined />}
                placeholder="请输入账号"
                autoComplete="username"
                name={field.name}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                status={fieldState.error ? 'error' : undefined}
              />
            )}
          />
          {errors.account ? (
            <span className="mt-1 block text-xs text-red-500">{errors.account.message}</span>
          ) : null}
        </label>

        <label className="block">
          <span className="mb-1 block text-sm text-slate-700">密码</span>
          <Controller
            control={control}
            name="password"
            render={({ field, fieldState }) => (
              <Input.Password
                size="large"
                prefix={<LockOutlined />}
                placeholder="请输入密码"
                autoComplete="current-password"
                name={field.name}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                status={fieldState.error ? 'error' : undefined}
              />
            )}
          />
          {errors.password ? (
            <span className="mt-1 block text-xs text-red-500">{errors.password.message}</span>
          ) : null}
        </label>

        {mutation.isError ? (
          <Alert type="error" showIcon message={errorMessage(mutation.error)} />
        ) : null}

        <Button type="primary" htmlType="submit" size="large" block loading={mutation.isPending}>
          登录
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-slate-400">v{env.appVersion}</p>
    </Card>
  )
}
