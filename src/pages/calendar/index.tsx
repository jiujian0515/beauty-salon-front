import { PlaceholderPage } from '@/components'

export default function CalendarPage() {
  return (
    <PlaceholderPage
      title="日历与时段库存"
      description="按资源泳道展示时段库存与余量，支持锁定与释放；桌面日历优先。"
      docSection="§9 日历与时段库存视图"
      todos={[
        '日视图：时间轴 × 资源泳道，槽位按余量着色',
        '槽位抽屉：查看关联预约、锁定/释放',
        '锁定/释放乐观更新与失败回滚',
        '周视图简化版与资源筛选',
        '30 秒轮询 + 回到页面即刷新',
      ]}
    />
  )
}
