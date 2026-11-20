import { z } from 'zod'
import { RESOURCE_TYPE } from '@/types/domain'

const statusSchema = z.union([z.literal(1), z.literal(0)])

const baseResourceSchema = z.object({
  type: z.enum([RESOURCE_TYPE.STAFF, RESOURCE_TYPE.ROOM]),
  /** STAFF 可留空（默认取绑定用户昵称），ROOM 必填 */
  name: z.string().trim().max(64, '资源名称最长 64 个字符'),
  userId: z.string().nullable(),
  status: statusSchema,
})

/** 技师必须选择绑定用户；床位必须填写名称，且不绑定用户 */
export const resourceSchema = baseResourceSchema.superRefine((values, ctx) => {
  if (values.type === RESOURCE_TYPE.STAFF) {
    if (!values.userId) {
      ctx.addIssue({ code: 'custom', path: ['userId'], message: '请选择绑定的用户' })
    }
    return
  }
  if (!values.name) {
    ctx.addIssue({ code: 'custom', path: ['name'], message: '请输入床位名称' })
  }
})

export type ResourceForm = z.infer<typeof baseResourceSchema>
