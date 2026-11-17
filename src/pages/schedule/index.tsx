import { PlaceholderPage } from '@/components'

export default function SchedulePage() {
  return (
    <PlaceholderPage
      title="排班管理"
      description="为资源设置可售窗口，保存后由服务端生成时段库存。"
      docSection="§10.4 排班管理"
      todos={[
        '按日期区间与资源筛选排班列表',
        '新增/编辑窗口表单（资源、日期、开始、结束、容量）',
        '提交后展示实际生成的时段数并提供「查看日历」入口',
        '已有预约的窗口限制编辑，引导改为锁定',
      ]}
    />
  )
}
