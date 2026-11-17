import { Alert, Card, Typography } from 'antd'
import { PageHeader } from './PageHeader'

export interface PlaceholderPageProps {
  title: string
  description?: string
  docSection?: string
  todos?: readonly string[]
}

/** 架构阶段的占位页：标注 BTD 依据与待实现清单 */
export function PlaceholderPage({
  title,
  description,
  docSection,
  todos = [],
}: PlaceholderPageProps) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <Card>
        <div className="flex flex-col gap-4">
          <Alert
            type="info"
            showIcon
            message="页面骨架已就绪，业务实现按里程碑推进"
            description={docSection ? `设计与交互约定见 BTD ${docSection}` : undefined}
          />
          {todos.length > 0 ? (
            <div>
              <Typography.Text strong>本页待实现</Typography.Text>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                {todos.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  )
}
