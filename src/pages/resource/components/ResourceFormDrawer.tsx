import { zodResolver } from '@hookform/resolvers/zod'
import { App, Button, Drawer, Input, Radio, Select, Space } from 'antd'
import { useEffect, useMemo } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { errorMessage } from '@/api/errors'
import type { Resource } from '@/api/resource'
import { FormField } from '@/components'
import { RESOURCE_TYPE } from '@/types/domain'
import type { ResourceType } from '@/types/domain'
import { useCreateResource, useStaffCandidates, useUpdateResource } from '../hooks'
import { resourceSchema } from '../schema'
import type { ResourceForm } from '../schema'

export interface ResourceFormDrawerProps {
  open: boolean
  /** null 表示新增 */
  record: Resource | null
  /** 新增时默认选中的资源类型（跟随当前 Tab） */
  defaultType: ResourceType
  onClose: () => void
}

const EMPTY_FORM: ResourceForm = {
  type: RESOURCE_TYPE.STAFF,
  name: '',
  userId: null,
  status: 1,
}

export function ResourceFormDrawer({
  open,
  record,
  defaultType,
  onClose,
}: ResourceFormDrawerProps) {
  const { message } = App.useApp()
  const isEdit = record !== null
  const createMutation = useCreateResource()
  const updateMutation = useUpdateResource()

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ResourceForm>({
    resolver: zodResolver(resourceSchema),
    defaultValues: EMPTY_FORM,
  })

  const type = useWatch({ control, name: 'type' })
  const isStaff = type === RESOURCE_TYPE.STAFF

  const candidatesQuery = useStaffCandidates(record?.id ?? null, open && isStaff)

  const candidateOptions = useMemo(() => {
    const options = (candidatesQuery.data ?? []).map((item) => ({
      value: item.id,
      label: item.phone
        ? `${item.nickname || item.phone}（${item.phone}）`
        : item.nickname || item.phone,
    }))
    // 已绑定用户可能因停用等原因不在候选中，补充当前值避免选择框只显示 id
    if (record?.userId && !options.some((option) => option.value === record.userId)) {
      options.unshift({
        value: record.userId,
        label: `${record.userName || record.name}${record.userPhone ? `（${record.userPhone}）` : ''}`,
      })
    }
    return options
  }, [candidatesQuery.data, record])

  useEffect(() => {
    if (!open) return
    reset(
      record
        ? {
            type: record.type,
            name: record.name,
            userId: record.userId,
            status: record.status === 1 ? 1 : 0,
          }
        : { ...EMPTY_FORM, type: defaultType },
    )
  }, [open, record, defaultType, reset])

  const submitting = createMutation.isPending || updateMutation.isPending

  const submit = handleSubmit((values) => {
    const onError = (error: unknown) => message.error(errorMessage(error))
    const name = values.name.trim()

    /** 编辑时未换绑用户就不传 userId，避免已停用用户被重新校验后拒绝保存 */
    const userId = values.userId && values.userId !== record?.userId ? values.userId : undefined

    const payload =
      values.type === RESOURCE_TYPE.STAFF
        ? { type: values.type, status: values.status, userId, name: name || undefined }
        : { type: values.type, status: values.status, name }

    if (record) {
      updateMutation.mutate(
        { id: record.id, payload },
        {
          onSuccess: () => {
            message.success('资源已更新')
            onClose()
          },
          onError,
        },
      )
      return
    }

    createMutation.mutate(payload, {
      onSuccess: () => {
        message.success('资源已创建')
        onClose()
      },
      onError,
    })
  })

  return (
    <Drawer
      title={isEdit ? '编辑资源' : '新增资源'}
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
          label="资源类型"
          required
          error={errors.type?.message}
          extra={isEdit ? '资源类型创建后不可修改' : '技师需绑定员工账号，床位为物理工位'}
        >
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <Radio.Group
                value={field.value}
                disabled={isEdit}
                onChange={(event) => field.onChange(event.target.value)}
                options={[
                  { label: '技师', value: RESOURCE_TYPE.STAFF },
                  { label: '床位', value: RESOURCE_TYPE.ROOM },
                ]}
              />
            )}
          />
        </FormField>

        {isStaff ? (
          <FormField
            label="绑定用户"
            required
            error={errors.userId?.message}
            extra="仅显示本商户启用中、未绑定其他技师资源的非管理员账号"
          >
            <Controller
              control={control}
              name="userId"
              render={({ field, fieldState }) => (
                <Select
                  value={field.value ?? undefined}
                  onChange={(value: string) => field.onChange(value)}
                  onBlur={field.onBlur}
                  showSearch
                  optionFilterProp="label"
                  placeholder="请选择要绑定的用户"
                  loading={candidatesQuery.isLoading}
                  disabled={candidatesQuery.isLoading}
                  options={candidateOptions}
                  notFoundContent="暂无可绑定用户，请先在「用户」中创建非管理员账号"
                  status={fieldState.error ? 'error' : undefined}
                  style={{ width: '100%' }}
                />
              )}
            />
          </FormField>
        ) : null}

        <FormField
          label="资源名称"
          required={!isStaff}
          error={errors.name?.message}
          extra={
            isStaff ? '留空时默认使用绑定用户的姓名' : '床位名称用于排班与日历展示，最长 64 个字符'
          }
        >
          <Controller
            control={control}
            name="name"
            render={({ field, fieldState }) => (
              <Input
                {...field}
                maxLength={64}
                placeholder={isStaff ? '选填，默认取绑定用户姓名' : '请输入床位名称'}
                status={fieldState.error ? 'error' : undefined}
              />
            )}
          />
        </FormField>

        <FormField
          label="状态"
          required
          error={errors.status?.message}
          extra="停用后不再参与新的排班与预约"
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
