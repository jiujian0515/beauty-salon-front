/*
 * @Author: liukui
 * @Date: 2026-11-18 03:51:34
 * @LastEditors: liukui
 * @LastEditTime: 2026-11-18 05:10:47
 * @Description:
 */
import { LockOutlined, UserOutlined } from '@ant-design/icons'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Alert, Button, Card, Input, Typography } from 'antd'
import { Controller, useForm } from 'react-hook-form'
import { Navigate, useNavigate, useSearchParams } from 'react-router'
import { fetchMe, login } from '@/api/auth'
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
  const user = useSessionStore((state) => state.user)
  const setToken = useSessionStore((state) => state.setToken)
  const setSession = useSessionStore((state) => state.setSession)
  const clearSession = useSessionStore((state) => state.clear)

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: '', password: '' },
  })

  const mutation = useMutation({
    // 先落 token 再拉用户信息：/auth/me 依赖请求头里的登录态
    mutationFn: async (values: LoginForm) => {
      const { token: nextToken } = await login(values)
      setToken(nextToken)
      try {
        const me = await fetchMe()
        setSession({ token: nextToken, user: me })
      } catch (error) {
        clearSession()
        throw error
      }
    },
    onSuccess: () => {
      const rawRedirect = searchParams.get('redirect')
      const target = rawRedirect && SAFE_REDIRECT.test(rawRedirect) ? rawRedirect : '/calendar'
      navigate(target, { replace: true })
    },
  })

  // 同时具备 token 与用户信息才算登录完成，避免拉取用户信息途中被提前重定向
  if (token && user) {
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
            name="phone"
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
          {errors.phone ? (
            <span className="mt-1 block text-xs text-red-500">{errors.phone.message}</span>
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
