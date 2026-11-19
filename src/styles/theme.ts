import type { ThemeConfig } from 'antd'

/**
 * 与 src/styles/index.css 的 @theme 保持一致：「雅奢 Morandi」暖棕主色（brand-500/600/700）。
 */
export const antdTheme: ThemeConfig = {
  token: {
    colorPrimary: '#9c7a53',
    colorPrimaryHover: '#836340',
    colorPrimaryActive: '#694d31',
    colorInfo: '#9c7a53',
    colorLink: '#9c7a53',
    colorLinkHover: '#694d31',
    borderRadius: 6,
    fontSize: 14,
    colorBgLayout: '#f7f4ef',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", "Segoe UI", Roboto, sans-serif',
  },
  components: {
    Layout: {
      headerHeight: 56,
      siderBg: '#3a2a1a',
    },
    Menu: {
      darkItemBg: '#3a2a1a',
      darkSubMenuItemBg: '#3a2a1a',
      darkItemColor: 'rgba(244, 236, 228, 0.75)',
      darkItemHoverBg: '#523c26',
      darkItemHoverColor: '#f4ece4',
      darkItemSelectedBg: '#694d31',
      darkItemSelectedColor: '#f4ece4',
    },
  },
}
