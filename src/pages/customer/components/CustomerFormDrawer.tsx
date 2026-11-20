import { zodResolver } from '@hookform/resolvers/zod'
import { App, Button, Drawer, Input, Radio, Space } from 'antd'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import type { Customer } from '@/api/customer'
import { errorMessage } from '@/api/errors'
import { FormField } from '@/components'
import { useCreateCustomer, useUpdateCustomer } from '../hooks'
import { createCustomerSchema, editCustomerSchema } from '../schema'
import type { CustomerForm } from '../schema'

export interface CustomerFormDrawerProps {
  open: boolean
  /** null 表示新增 */
  record: Customer | null
  onClose: () => void
}

const EMPTY_FORM: CustomerForm = { phone: '', password: '', nickname: '', status: 1 }

export function CustomerFormDrawer({ open, record, onClose }: CustomerFormDrawerProps) {
  const { message } = App.useApp()
  const isEdit = record !== null
  const createMutation = useCreateCustomer()
  const updateMutation = useUpdateCustomer()

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerForm>({
    resolver: zodResolver(isEdit ? editCustomerSchema : createCustomerSchema),
    defaultValues: EMPTY_FORM,
  })

  useEffect(() => {
    if (!open) return
    reset(
      record
        ? {
            phone: record.phone,
            password: '',
            nickname: record.nickname,
            status: record.status === 1 ? 1 : 0,
          }
        : EMPTY_FORM,
    )
  }, [open, record, reset])

  const submitting = createMutation.isPending || updateMutation.isPending

  const submit = handleSubmit((values) => {
    const onError = (error: unknown) => message.error(errorMessage(error))

    if (record) {
      updateMutation.mutate(
        {
          id: record.id,
          payload: {
            phone: values.phone,
            nickname: values.nickname,
            status: values.status,
          },
        },
        {
          onSuccess: () => {
            message.success('顾客信息已更新')
            onClose()
          },
          onError,
        },
      )
      return
    }

    createMutation.mutate(
      {
        phone: values.phone,
        password: values.password,
        nickname: values.nickname,
        status: values.status,
      },
      {
        onSuccess: () => {
          message.success('顾客已创建，可用手机号与初始密码登录顾客端')
          onClose()
        },
        onError,
      },
    )
  })

  return (
    <Drawer
      title={isEdit ? '编辑顾客' : '新增顾客'}
      width={480}
      open={open}
      onClose={onClose}
      destroyOnHidden
      footer={
        <div className="flex justify-end">
          <Space>
            <Button onClick={onClose} disabled={submitting}>
              取消
            </Button>
            <Button type="primary" loading={submitting} onClick={submit}>
              保存
            </Button>
          </Space>
        </div>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={submit}>
        <FormField
          label="手机号"
          required
          error={errors.phone?.message}
          extra="手机号即顾客端登录账号，顾客表内唯一（可与员工账号同号）"
        >
          <Controller
            control={control}
            name="phone"
            render={({ field, fieldState }) => (
              <Input
                {...field}
                maxLength={11}
                placeholder="请输入 11 位手机号"
                status={fieldState.error ? 'error' : undefined}
              />
            )}
          />
        </FormField>

        <FormField label="姓名" required error={errors.nickname?.message}>
          <Controller
            control={control}
            name="nickname"
            render={({ field, fieldState }) => (
              <Input
                {...field}
                maxLength={64}
                placeholder="请输入姓名"
                status={fieldState.error ? 'error' : undefined}
              />
            )}
          />
        </FormField>

        {isEdit ? null : (
          <FormField
            label="初始密码"
            required
            error={errors.password?.message}
            extra="6-32 位，创建后请告知顾客自行保管"
          >
            <Controller
              control={control}
              name="password"
              render={({ field, fieldState }) => (
                <Input.Password
                  {...field}
                  maxLength={32}
                  placeholder="请输入初始密码"
                  autoComplete="new-password"
                  status={fieldState.error ? 'error' : undefined}
                />
              )}
            />
          </FormField>
        )}

        <FormField
          label="状态"
          required
          error={errors.status?.message}
          extra="停用后无法登录顾客端"
        >
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Radio.Group
                value={field.value}
                onChange={(event) => field.onChange(event.target.value)}
                options={[
                  { label: '启用', value: 1 },
                  { label: '停用', value: 0 },
                ]}
              />
            )}
          />
        </FormField>
      </form>
    </Drawer>
  )
}
