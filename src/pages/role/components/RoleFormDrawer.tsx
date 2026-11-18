import { zodResolver } from '@hookform/resolvers/zod'
import { App, Button, Drawer, Input, Space } from 'antd'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { errorMessage } from '@/api/errors'
import type { Role } from '@/api/role'
import { FormField } from '@/components'
import { useCreateRole, useUpdateRole } from '../hooks'
import { roleFormSchema } from '../schema'
import type { RoleForm } from '../schema'

export interface RoleFormDrawerProps {
  open: boolean
  /** null 表示新增 */
  record: Role | null
  onClose: () => void
}

const EMPTY_FORM: RoleForm = { name: '', code: '' }

export function RoleFormDrawer({ open, record, onClose }: RoleFormDrawerProps) {
  const { message } = App.useApp()
  const isEdit = record !== null
  const createMutation = useCreateRole()
  const updateMutation = useUpdateRole()

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RoleForm>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: EMPTY_FORM,
  })

  useEffect(() => {
    if (!open) return
    reset(record ? { name: record.name, code: record.code } : EMPTY_FORM)
  }, [open, record, reset])

  const submitting = createMutation.isPending || updateMutation.isPending

  const submit = handleSubmit((values) => {
    const onError = (error: unknown) => message.error(errorMessage(error))

    if (record) {
      updateMutation.mutate(
        { id: record.id, payload: { name: values.name, code: values.code } },
        {
          onSuccess: () => {
            message.success('角色已更新')
            onClose()
          },
          onError,
        },
      )
      return
    }

    createMutation.mutate(values, {
      onSuccess: () => {
        message.success('角色已创建')
        onClose()
      },
      onError,
    })
  })

  return (
    <Drawer
      title={isEdit ? '编辑角色' : '新增角色'}
      width={440}
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
          label="角色名称"
          required
          error={errors.name?.message}
          extra="中文显示名，如「店长」"
        >
          <Controller
            control={control}
            name="name"
            render={({ field, fieldState }) => (
              <Input
                {...field}
                maxLength={64}
                placeholder="请输入角色名称"
                status={fieldState.error ? 'error' : undefined}
              />
            )}
          />
        </FormField>

        <FormField
          label="角色代码"
          required
          error={errors.code?.message}
          extra="大写字母开头，2-32 位字母/数字/下划线；代码即账号的角色标识，修改后该角色用户需重新登录生效"
        >
          <Controller
            control={control}
            name="code"
            render={({ field, fieldState }) => (
              <Input
                {...field}
                maxLength={32}
                placeholder="例如 MANAGER"
                status={fieldState.error ? 'error' : undefined}
              />
            )}
          />
        </FormField>
      </form>
    </Drawer>
  )
}
