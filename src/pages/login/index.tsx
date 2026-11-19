/*
 * @Author: liukui
 * @Date: 2026-11-18 03:51:34
 * @LastEditors: liukui
 * @LastEditTime: 2026-11-20 01:31:22
 * @Description:
 */
import {
  ArrowRightOutlined,
  ClockCircleOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  LockOutlined,
  LoadingOutlined,
  SafetyCertificateOutlined,
  ScanOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Alert } from 'antd'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Navigate, useNavigate, useSearchParams } from 'react-router'
import { fetchMe, login } from '@/api/auth'
import { errorMessage } from '@/api/errors'
import logoUrl from '@/assets/images/logo.png'
import { env } from '@/config/env'
import { useSessionStore } from '@/stores/session'
import { loginSchema } from './schema'
import type { LoginForm } from './schema'

/** 登录回跳只允许站内相对路径，防开放重定向（BTD §7.2） */
const SAFE_REDIRECT = /^\/(?!\/)/

const FEATURES = [
  {
    icon: <ClockCircleOutlined />,
    title: '时段库存原子级防超卖',
    desc: '美疗师日程与独立私密理疗房智能互斥排期',
  },
  {
    icon: <SafetyCertificateOutlined />,
    title: '线上预约定金 · 智能原路退还',
    desc: '有效降低爽约率，自动计算阶梯式退订手续费',
  },
  {
    icon: <ScanOutlined />,
    title: '前台极速扫码与到店核销',
    desc: '客户出示动态预约码，1 秒完成接待与茶歇分配',
  },
] as const

/** 设计稿的输入框基础样式，错误态只替换边框色 */
const INPUT_BASE =
  'block w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm text-morandi-charcoal transition placeholder:text-morandi-slate/50 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-400'
const INPUT_IDLE = 'border-morandi-border bg-brand-50/40'
const INPUT_ERROR = 'border-red-400 bg-brand-50/40'

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [passwordVisible, setPasswordVisible] = useState(false)
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
    <div className="flex min-h-screen flex-col bg-morandi-mesh font-sans text-morandi-charcoal antialiased selection:bg-brand-200 selection:text-brand-900">
      <header className="z-10 flex w-full items-center justify-between px-6 py-5 lg:px-12">
        <div className="flex items-center gap-3">
          <img
            src={logoUrl}
            alt="雅奢美学"
            className="h-10 w-10 shrink-0 rounded-full object-cover"
          />
          <div>
            <span className="block text-sm font-semibold uppercase tracking-wider text-morandi-charcoal">
              雅奢美学 · 商户工作台
            </span>
            <span className="block text-[11px] font-light uppercase tracking-widest text-morandi-slate">
              Atelier Morandi Pro System
            </span>
          </div>
        </div>
      </header>

      <main className="flex grow items-center justify-center px-4 py-4 sm:px-6 sm:py-8 lg:px-8">
        <div className="grid min-h-[640px] w-full max-w-5xl grid-cols-1 overflow-hidden rounded-3xl border border-morandi-border bg-white/95 shadow-morandi-lg lg:grid-cols-12">
          {/* 左侧品牌展示 */}
          <section className="relative flex flex-col justify-between overflow-hidden bg-linear-to-br from-brand-900 via-brand-800 to-brand-900 p-8 text-brand-100 sm:p-10 lg:col-span-5">
            <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand-500/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-brand-400/10 blur-3xl" />

            <div className="relative z-10">
              <div className="mb-8 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium tracking-wide text-brand-200">
                <span aria-hidden className="text-xs">
                  ✦
                </span>
                精品美疗 · 智能数字中枢
              </div>
              <h1 className="mb-4 font-serif text-3xl font-medium leading-tight tracking-normal text-white sm:text-4xl">
                数字化赋能
                <br />
                精致美学沙龙
              </h1>
              <p className="mb-8 text-sm font-light leading-relaxed text-brand-200/80">
                专注高端轻医美、面部抗衰与身体芳疗。集时段库存精细调度、定金秒付与预约核销于一体的专享后台。
              </p>

              <div className="space-y-4">
                {FEATURES.map((feature) => (
                  <div key={feature.title} className="group flex items-start gap-3.5">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/10 text-xs text-brand-200 transition group-hover:bg-brand-500/40">
                      {feature.icon}
                    </div>
                    <div>
                      <h2 className="text-xs font-semibold tracking-wide text-white">
                        {feature.title}
                      </h2>
                      <p className="text-[11px] font-light text-brand-200/70">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative z-10 mt-8 border-t border-brand-700/60 pt-8">
              <blockquote className="font-serif text-xs italic leading-relaxed text-brand-200/90">
                “专注美与舒缓的纯粹体验，将繁复流程交付于智慧秩序。”
              </blockquote>
              <span className="mt-1 block text-[10px] uppercase tracking-widest text-brand-300/60">
                —— 雅奢沙龙运营规范委员会
              </span>
            </div>
          </section>

          {/* 右侧登录表单 */}
          <section className="flex flex-col justify-between bg-white p-8 sm:p-12 lg:col-span-7 lg:p-14">
            <div>
              <div className="mb-2">
                <span className="rounded-md border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-medium uppercase tracking-widest text-brand-600">
                  商户专享通道
                </span>
              </div>
              <h2 className="mb-1 text-2xl font-bold tracking-tight text-morandi-charcoal">
                商户控制台登录
              </h2>
              <p className="text-xs font-normal leading-relaxed text-morandi-slate">
                登录后管理门店排班、客户预约、定金结算与服务核销
              </p>

              <div className="mt-6 flex border-b border-morandi-border text-sm">
                <span className="flex items-center border-b-2 border-brand-600 pb-2.5 font-medium text-brand-700">
                  账号密码登录
                </span>
              </div>

              <form
                className="mt-6 space-y-4"
                noValidate
                onSubmit={handleSubmit((values) => mutation.mutate(values))}
              >
                <div>
                  <label
                    htmlFor="login-phone"
                    className="mb-1.5 block text-xs font-medium text-morandi-charcoal"
                  >
                    商户账号 / 手机号
                  </label>
                  <Controller
                    control={control}
                    name="phone"
                    render={({ field, fieldState }) => (
                      <div className="relative rounded-xl shadow-sm">
                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-morandi-slate">
                          <UserOutlined className="text-sm" />
                        </span>
                        <input
                          {...field}
                          id="login-phone"
                          type="text"
                          autoComplete="username"
                          placeholder="请输入商户账号或管理员手机号"
                          aria-invalid={Boolean(fieldState.error)}
                          className={`${INPUT_BASE} ${fieldState.error ? INPUT_ERROR : INPUT_IDLE}`}
                        />
                      </div>
                    )}
                  />
                  {errors.phone ? (
                    <span className="mt-1 block text-xs text-red-500">{errors.phone.message}</span>
                  ) : null}
                </div>

                <div>
                  <label
                    htmlFor="login-password"
                    className="mb-1.5 block text-xs font-medium text-morandi-charcoal"
                  >
                    登录密码
                  </label>
                  <Controller
                    control={control}
                    name="password"
                    render={({ field, fieldState }) => (
                      <div className="relative rounded-xl shadow-sm">
                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-morandi-slate">
                          <LockOutlined className="text-sm" />
                        </span>
                        <input
                          {...field}
                          id="login-password"
                          type={passwordVisible ? 'text' : 'password'}
                          autoComplete="current-password"
                          placeholder="请输入登录密码"
                          aria-invalid={Boolean(fieldState.error)}
                          className={`${INPUT_BASE} pr-11 ${fieldState.error ? INPUT_ERROR : INPUT_IDLE}`}
                        />
                        <button
                          type="button"
                          aria-label={passwordVisible ? '隐藏密码' : '显示密码'}
                          aria-pressed={passwordVisible}
                          onClick={() => setPasswordVisible((visible) => !visible)}
                          className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-morandi-slate transition hover:text-morandi-charcoal focus:outline-none"
                        >
                          {passwordVisible ? (
                            <EyeOutlined className="text-sm" />
                          ) : (
                            <EyeInvisibleOutlined className="text-sm" />
                          )}
                        </button>
                      </div>
                    )}
                  />
                  {errors.password ? (
                    <span className="mt-1 block text-xs text-red-500">
                      {errors.password.message}
                    </span>
                  ) : null}
                </div>

                {mutation.isError ? (
                  <Alert
                    type="error"
                    showIcon
                    message={errorMessage(mutation.error)}
                    className="rounded-xl!"
                  />
                ) : null}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={mutation.isPending}
                    className="flex w-full items-center justify-center rounded-xl bg-linear-to-r from-brand-700 via-brand-600 to-brand-700 px-4 py-3 text-sm font-medium tracking-wide text-white shadow-md transition-all duration-200 hover:from-brand-800 hover:to-brand-800 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-80"
                  >
                    {mutation.isPending ? (
                      <>
                        <LoadingOutlined spin className="mr-2" />
                        正在安全验证…
                      </>
                    ) : (
                      <>
                        立即登录工作台
                        <ArrowRightOutlined className="ml-2" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            <div className="mt-8 border-t border-morandi-border/60 pt-4 text-center text-[11px] text-morandi-slate">
              <span className="font-mono font-medium text-morandi-charcoal">v{env.appVersion}</span>
            </div>
          </section>
        </div>
      </main>

      <footer className="flex w-full flex-col items-center justify-center gap-1 py-4 text-center text-xs text-morandi-slate/70 sm:flex-row sm:gap-2">
        <span>© {new Date().getFullYear()} 美容院商户后台 · 智能数字化运营系统</span>
        <span aria-hidden className="hidden sm:inline">
          ·
        </span>
        <a
          href="https://beian.miit.gov.cn/"
          target="_blank"
          rel="noopener noreferrer"
          className="transition hover:text-morandi-slate"
        >
          湘ICP备2026055681号-1
        </a>
      </footer>
    </div>
  )
}
