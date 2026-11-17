/** 后端统一响应结构（PTD §6） */
export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

/** 分页载荷，字段名以后端契约为准，仅在此处适配一次（BTD §7.8） */
export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  size: number
}

export interface PageQuery {
  page?: number
  size?: number
}
