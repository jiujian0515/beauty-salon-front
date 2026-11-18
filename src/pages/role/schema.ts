import { z } from 'zod'

/** 与后端 RoleCreateRequest 的校验保持一致 */
export const roleFormSchema = z.object({
  name: z.string().trim().min(1, '请输入角色名称').max(64, '角色名称最长 64 个字符'),
  code: z
    .string()
    .trim()
    .regex(/^[A-Z][A-Z0-9_]{1,31}$/, '角色代码需为大写字母开头，2-32 位的字母、数字或下划线'),
})

export type RoleForm = z.infer<typeof roleFormSchema>
