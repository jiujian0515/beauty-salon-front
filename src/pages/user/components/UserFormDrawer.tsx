import { zodResolver } from '@hookform/resolvers/zod'
import { App, Button, Drawer, Input, Radio, Select, Space } from 'antd'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { errorMessage } from '@/api/errors'
import type { SysUser } from '@/api/user'
import { FormField } from '@/components'
import { useRolesQuery } from '@/hooks/useRoles'
import { useCreateUser, useUpdateUser } from '../hooks'
import { createUserSchema, editUserSchema } from '../schema'
import type { UserForm } from '../schema'

export interface UserFormDrawerProps {
  open: boolean
  /** null 表示新增 */
  record: SysUser | null
  onClose: () => void
}

const EMPTY_FORM: UserForm = { phone: '', password: '', nickname: '', role: '', status: 1 }

export function UserFormDrawer({ open, record, onClose }: UserFormDrawerProps) {
  const { message } = App.useApp()
  const isEdit = record !== null
  const rolesQuery = useRolesQuery()
  const createMutation = useCreateUser()
  const updateMutation = useUpdateUser()

  const roleOptions = (rolesQuery.data ?? []).map((role) => ({
    value: role.code,
    label: `${role.name}`,
  }))

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserForm>({
    resolver: zodResolver(isEdit ? editUserSchema : createUserSchema),
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
            role: record.role,
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
            role: values.role,
            status: values.status,
          },
        },
        {
          onSuccess: () => {
            message.success('用户信息已更新')
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
        role: values.role,
        status: values.status,
      },
      {
        onSuccess: () => {
          message.success('用户已创建，可用手机号与初始密码登录')
          onClose()
        },
        onError,
      },
    )
  })

  return (
    <Drawer
      title={isEdit ? '编辑用户' : '新增用户'}
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
          extra="手机号即登录账号，全库唯一"
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

        <FormField
          label="角色"
          required
          error={errors.role?.message}
          extra="角色来自「角色管理」的角色字典；顾客不绑定商户"
        >
          <Controller
            control={control}
            name="role"
            render={({ field, fieldState }) => (
              <Select
                {...field}
                optionFilterProp="label"
                placeholder="请选择角色"
                loading={rolesQuery.isLoading}
                options={roleOptions}
                status={fieldState.error ? 'error' : undefined}
                style={{ width: '100%' }}
              />
            )}
          />
        </FormField>

        {isEdit ? null : (
          <FormField
            label="初始密码"
            required
            error={errors.password?.message}
            extra="6-32 位，创建后请告知用户自行保管"
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

        <FormField label="状态" required error={errors.status?.message}>
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
