import { zodResolver } from '@hookform/resolvers/zod'
import { App, Input, Modal } from 'antd'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { errorMessage } from '@/api/errors'
import { FormField } from './FormField'

const resetPasswordSchema = z
  .object({
    newPassword: z.string().min(6, '密码长度需为 6-32 位').max(32, '密码长度需为 6-32 位'),
    confirmPassword: z.string().min(1, '请再次输入新密码'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ['confirmPassword'],
    message: '两次输入的密码不一致',
  })

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>

const EMPTY_FORM: ResetPasswordForm = { newPassword: '', confirmPassword: '' }

export interface ResetPasswordModalProps {
  open: boolean
  /** 被重置的对象描述，如用户姓名或手机号 */
  subject: string
  onSubmit: (newPassword: string) => Promise<unknown>
  onClose: () => void
}

/** 重置密码弹窗：校验两次输入一致后交给调用方提交 */
export function ResetPasswordModal({ open, subject, onSubmit, onClose }: ResetPasswordModalProps) {
  const { message } = App.useApp()
  const [submitting, setSubmitting] = useState(false)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: EMPTY_FORM,
  })

  useEffect(() => {
    if (open) reset(EMPTY_FORM)
  }, [open, reset])

  const submit = handleSubmit(async (values) => {
    setSubmitting(true)
    try {
      await onSubmit(values.newPassword)
      message.success(`已重置「${subject}」的密码，请告知对方`)
      onClose()
    } catch (error) {
      message.error(errorMessage(error))
    } finally {
      setSubmitting(false)
    }
  })

  return (
    <Modal
      title="重置密码"
      open={open}
      okText="确认重置"
      cancelText="取消"
      confirmLoading={submitting}
      onOk={submit}
      onCancel={onClose}
      destroyOnHidden
    >
      <p className="mb-4 text-sm text-slate-500">
        将为「{subject || '—'}」设置新密码，旧密码立即失效。
      </p>
      <form className="flex flex-col gap-4" onSubmit={submit}>
        <FormField label="新密码" required error={errors.newPassword?.message} extra="6-32 位">
          <Controller
            control={control}
            name="newPassword"
            render={({ field, fieldState }) => (
              <Input.Password
                {...field}
                maxLength={32}
                placeholder="请输入新密码"
                autoComplete="new-password"
                status={fieldState.error ? 'error' : undefined}
              />
            )}
          />
        </FormField>
        <FormField label="确认新密码" required error={errors.confirmPassword?.message}>
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field, fieldState }) => (
              <Input.Password
                {...field}
                maxLength={32}
                placeholder="请再次输入新密码"
                autoComplete="new-password"
                status={fieldState.error ? 'error' : undefined}
              />
            )}
          />
        </FormField>
      </form>
    </Modal>
  )
}
