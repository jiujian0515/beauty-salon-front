import type { ThemeConfig } from 'antd'

/**
 * 设计令牌暂用 antd 默认值，设计定稿后与 src/shared/styles/index.css 的 @theme 同步替换（BTD §5.1）。
 */
export const antdTheme: ThemeConfig = {
  token: {
    colorPrimary: '#1677ff',
    borderRadius: 6,
    fontSize: 14,
    colorBgLayout: '#f7f8fa',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", "Segoe UI", Roboto, sans-serif',
  },
  components: {
    Layout: {
      headerHeight: 56,
      siderBg: '#001529',
    },
  },
}
