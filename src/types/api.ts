/** 后端统一响应结构（PTD §6） */
export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

/**
 * 后端分页原始结构（common.PageResult）。
 * JacksonConfig 把所有 Long 序列化为字符串，因此 total/page/size/pages 拿到的是字符串，
 * 必须在接口层归一为数字，页面只消费 {@link PageResult}（BTD §7.8）。
 */
export interface BackendPageResult<T> {
  records: T[]
  total: string
  page: string
  size: string
  pages: string
}

/** 归一后的分页结构，页面统一消费这一种 */
export interface PageResult<T> {
  records: T[]
  total: number
  page: number
  size: number
}

export interface PageQuery {
  page?: number
  size?: number
}
