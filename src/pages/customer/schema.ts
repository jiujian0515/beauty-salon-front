import { z } from 'zod'

const phoneSchema = z
  .string()
  .trim()
  .regex(/^1[3-9]\d{9}$/, '请输入 1[3-9] 开头的 11 位手机号')

const nicknameSchema = z.string().trim().min(1, '请输入姓名').max(64, '姓名最长 64 个字符')

const passwordSchema = z.string().min(6, '密码长度需为 6-32 位').max(32, '密码长度需为 6-32 位')

const statusSchema = z.union([z.literal(1), z.literal(0)])

/** 新增与编辑共用字段结构，保证表单类型统一 */
const baseCustomerSchema = z.object({
  phone: phoneSchema,
  password: z.string(),
  nickname: nicknameSchema,
  status: statusSchema,
})

export const createCustomerSchema = baseCustomerSchema.extend({ password: passwordSchema })

/** 编辑：密码走独立的「重置密码」入口 */
export const editCustomerSchema = baseCustomerSchema

export type CustomerForm = z.infer<typeof baseCustomerSchema>
