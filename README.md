# 美容院轻量 SaaS · 商户后台前端说明文档

> 版本：v1.1（2026-11-20）｜与代码同步
>
> 范围：商户后台 Web（React 19 + TypeScript + Ant Design 5 + Tailwind CSS 4），**不含**顾客端（Taro 小程序 / H5）
>
> 关联：[README-PRD.md](./README-PRD.md)（业务规则与验收）、[README-PTD.md](./README-PTD.md)（技术约束）。本文只写「前端怎么做」，规则原文不复制。

## 1. 项目概览

| 项 | 说明 |
|---|---|
| 形态 | SPA，Nginx 托管静态资源并把 `/api` 反代到 Spring Boot（同源，无跨域、不使用跨站 Cookie） |
| 鉴权 | Sa-Token；前端在 `Authorization` 头携带 token，`GET /auth/me` 是角色的唯一来源 |
| 租户 | 单商户单门店演示；`merchantId` 由服务端从登录态推导，前端不传、不跨账号复用缓存 |
| 界面 | 全中文、桌面优先（最小 1280px）、时区固定 `Asia/Shanghai`、金额一律整数「分」 |
| 边界 | 前端负责录入校验、规则可视提示、防误操作、失败兜底；库存与状态流转由服务端裁决，**前端校验必须假设会被绕过** |

### 1.1 当前进度

| 模块 | 状态 |
|---|---|
| 工程骨架（路由/守卫/权限矩阵/HTTP/会话/设计令牌/公共组件/CI） | 已完成（M0） |
| 登录、用户管理、服务项目、角色管理 | 已完成，接真实接口 |
| 日历、工作台、排班、资源、预约列表/详情、定金流水、审计日志 | 占位页，按 §13 路线图推进 |

## 2. 技术栈

| 类别 | 选型 | 版本 | 用途 |
|---|---|---|---|
| 语言 / 框架 | TypeScript / React | 5.9 / 19.3 | 全量类型化（`strict` 开启）、UI 运行时 |
| 构建 | Vite | 7.3 | 开发与构建，路由级分包，`sourcemap: 'hidden'` |
| 组件库 | Ant Design + `@ant-design/v5-patch-for-react-19` | 5.29 / 1.0 | 表格、表单、弹层、反馈 |
| 图标 | `@ant-design/icons` | 5.6 | 按需命名导入，禁止整包 |
| 样式 | Tailwind CSS（`@tailwindcss/vite`） | 4.3 | 布局与设计令牌落地，CSS-first 配置 |
| 路由 | React Router | 7.18 | `createBrowserRouter` + 懒加载 + 守卫 |
| 服务端状态 | TanStack Query | 5.10 | 缓存、失效、轮询、并发去重 |
| 客户端状态 | Zustand | 5.1 | 仅会话（persist 到 sessionStorage） |
| 表单 | React Hook Form + Zod | 7.9 / 4.6 | 表单状态与校验，Schema 兼作类型来源 |
| 时间 | dayjs（utc/timezone/duration + zh-cn） | 1.11 | 时区与格式化，与 antd 共用同一实例 |
| 观测 | `@sentry/react` | 11.13 | 异常与性能，脱敏后上报 |
| 质量 | ESLint 9（flat）+ Prettier 3 + lint-staged | — | 规范与提交前检查 |
| 包管理 | pnpm | 11.21 | 锁定 `pnpm-lock.yaml` |

### 2.1 已知坑与处置

| 风险 | 处置 |
|---|---|
| React 19 + antd 5 静态方法（`message`/`modal`） | 引入 `@ant-design/v5-patch-for-react-19`，统一用 `App.useApp()` |
| Tailwind 4 + antd 样式冲突 | antd 为 CSS-in-JS **无层样式**，覆盖时把规则写在 `@layer` 之外并用双类提权；preflight 冲突需专项验证 |
| Tailwind 4 CSS-first 配置 | 令牌集中在 `src/styles/index.css` 的 `@theme`，与 `src/styles/theme.ts` 的 antd token 同源 |
| dayjs 多实例导致插件失效 | `pnpm.overrides` 锁定单版本 |

### 2.2 设计令牌

主色 `brand-500 #9c7a53`（`theme.ts` 的 `colorPrimary` 保持一致）｜页面底色 `morandi-sand #f7f4ef`｜侧边栏 `#3a2a1a`｜顶栏 56px（与 antd `Layout.headerHeight` 对齐）｜圆角 6/8｜系统中文栈。**禁止在页面中硬编码色值**，新增令牌需先进 `@theme` 与 `theme.ts` 两处。

## 3. 目录结构

```
beauty-salon-front/
├── index.html
├── vite.config.ts                 # 开发代理 /api → localhost:8080、manualChunks、hidden sourcemap
├── tsconfig.json                  # strict、noUncheckedIndexedAccess、@/* → src/*
├── eslint.config.js / .prettierrc # 规范与格式
├── .env.development / .env.production
└── src/
    ├── main.tsx                   # 入口：StrictMode、Sentry 初始化、antd React 19 补丁
    ├── App.tsx                    # Provider 装配：QueryClient → ConfigProvider(zh_CN + antdTheme) → Router
    ├── vite-env.d.ts
    ├── api/                       # 接口层：请求 + DTO→ViewModel 适配，页面不直接 fetch
    │   ├── http.ts                #   fetch 实例：超时、鉴权头、Idempotency-Key、401 并发去重
    │   ├── errors.ts              #   AppError 与业务码单点映射
    │   ├── queryClient.ts         #   QueryClient 全局策略 + queryKeys 工厂
    │   ├── auth.ts                #   登录 / 当前用户 / 登出
    │   ├── user.ts                #   用户管理（分页、增删改、重置密码）
    │   ├── serviceItem.ts         #   服务项目（金额字符串 → 整数分）
    │   └── role.ts                #   角色字典（全局、不分页）
    ├── components/                # 业务无关公共组件，统一由 index.ts 导出
    │   ├── PageHeader / ListToolbar / QueryBoundary      # 页头、列表工具栏、加载/空/错误三态
    │   ├── StatusTag / MoneyText / DurationText          # 状态、金额、时长统一展示
    │   └── DangerConfirm / FormField / ResetPasswordModal / PlaceholderPage
    ├── config/env.ts              # VITE_* 归一，导出 env / isProduction
    ├── constants/
    │   ├── permissions.ts         #   角色、权限点、ROLE_PERMISSIONS 矩阵
    │   ├── status.ts              #   预约 / 流水 / 时段状态文案与颜色
    │   └── constants.ts           #   分页、时限、轮询间隔、金额上限
    ├── hooks/                     # 通用 hooks
    │   ├── useListParams / usePaginatedQuery / useListPage   # 列表三件套（URL、分页、搜索草稿）
    │   ├── usePermission / useRoles
    │   └── useInvalidate / useUrlQueryState / useDebouncedValue / useOnlineStatus
    ├── layouts/
    │   ├── AppLayout.tsx          #   侧边导航（ROUTE_META ∩ 角色）+ 顶栏 + 内容区
    │   └── BlankLayout.tsx        #   登录页外壳
    ├── pages/                     # 按业务模块内聚：index.tsx + hooks.ts / schema.ts / components/
    │   ├── login/                 # 已实现：登录（schema.ts 为 Zod 校验）
    │   ├── user/                  # 已实现：用户 CRUD、角色分配、重置密码
    │   ├── service/               # 已实现：服务项目 CRUD、上下架
    │   ├── role/                  # 已实现：角色字典 CRUD + 内置权限矩阵（只读）
    │   ├── reservation/           # 占位：index.tsx（列表）、detail.tsx（详情）
    │   ├── calendar/ dashboard/ schedule/ resource/ deposit/ audit/   # 占位页
    │   └── error/                 # Forbidden / NotFound / RouteError
    ├── router/
    │   ├── index.tsx              #   路由表 + 懒加载 + errorElement
    │   ├── guards.tsx             #   RequireAuth / RequireRole
    │   └── routes.tsx             #   ROUTE_META（菜单与路由共用）
    ├── stores/session.ts          # 会话（token/用户/角色）+ http 鉴权绑定
    ├── styles/
    │   ├── index.css              #   Tailwind 入口与 @theme 令牌
    │   └── theme.ts               #   antd ConfigProvider token
    ├── types/
    │   ├── api.ts                 #   ApiResponse、PageResult
    │   └── domain.ts              #   状态枚举与 StatusMeta
    ├── utils/
    │   ├── money.ts / datetime.ts / status.ts    # 分↔元、时区与时限判定、状态派生
    │   └── permission.ts / format.ts / observability.ts   # 权限判定、脱敏、Sentry 按需初始化
    └── assets/images/logo.png
```

**调用约定**：页面 → `pages/<模块>/hooks.ts`（Query 查询/变更）→ `api/*` → `http`。金额、时间、权限判定统一走 `utils`，页面内不重复实现；页面私有逻辑（`hooks.ts` / `schema.ts` / `components/`）留在模块目录内。

## 4. 路由与权限

### 4.1 路由表

| 路径 | 页面 | 可见角色 | 说明 |
|---|---|---|---|
| `/login` | 登录 | 公开 | 已登录访问重定向首页 |
| `/` | — | 已登录 | 重定向 `/calendar`（日历优先） |
| `/calendar` | 日历与时段库存 | STAFF / ADMIN | 登录后落地页 |
| `/dashboard` | 今日概览 | STAFF / ADMIN | |
| `/reservations` `/reservations/:id` | 预约列表 / 详情 | STAFF / ADMIN | |
| `/schedules` | 排班管理 | STAFF / ADMIN | |
| `/services` | 服务项目 | STAFF / ADMIN | 写操作按权限隐藏 |
| `/resources` | 资源管理 | STAFF / ADMIN | |
| `/deposits` | 定金流水 | STAFF / ADMIN | |
| `/users` | 用户管理 | ADMIN | |
| `/roles` | 角色管理 | ADMIN | |
| `/audit-logs` | 审计日志 | ADMIN | |
| `/403` `*` | 403 / 404 | 公开 | `errorElement` 兜底路由异常 |

约定：

1. 列表筛选与分页写进 URL（`useListParams`），刷新、分享、返回视图一致。
2. 页面级懒加载：路由用 `page(() => import(...))` 包装，公共依赖留在主 chunk。
3. 未知路径落 404；已登录但无权限渲染 403，而不是跳回首页。

### 4.2 权限点（`constants/permissions.ts`）

| 权限点 | 说明 | STAFF | ADMIN |
|---|---|:--:|:--:|
| `service:write` | 服务项目维护 | — | ✅ |
| `resource:write` | 资源维护 | ✅ | ✅ |
| `schedule:write` | 排班维护 | ✅ | ✅ |
| `slot:lock` | 时段锁定/释放 | ✅ | ✅ |
| `reservation:create` | 代客下单 | — | ✅ |
| `reservation:cancel` | 取消预约与退款 | — | ✅ |
| `reservation:checkin` | 发起核销 | ✅ | ✅ |
| `reservation:checkin:force` | 代顾客确认核销 | — | ✅ |
| `staff:manage` | 用户维护 | — | ✅ |
| `role:manage` | 角色维护 | — | ✅ |
| `audit:read` | 审计日志查看 | — | ✅ |

### 4.3 实现方式

- **路由级**：`RequireAuth` 拦未登录（带 `redirect`），`RequireRole` 拦角色（渲染 403）。
- **菜单级**：`AppLayout` 用 `ROUTE_META.filter(hasAnyRole)` 派生导航，无权限项**不渲染**；顶栏含环境角标（非生产）、版本号、数据刷新、离线提示与退出登录。
- **按钮级**：`usePermission(PERMISSIONS.X)`，无权限不渲染；列表空位用禁用态 + Tooltip 解释。
- **字段级**：顾客手机号脱敏（`utils/format.ts`）。
- **角色来源**：只信 `GET /auth/me`；返回 `CUSTOMER` 或未知角色时拒绝登录并清会话。
- 前端只做可用性收敛，数据隔离依赖服务端按登录态拼 `merchant_id`。

## 5. API 接入层

### 5.1 响应与错误模型

后端统一返回 `{ code, message, data }`，业务失败为 **HTTP 200 + `code !== 0`**。`api/http.ts` 做双层判定（HTTP 状态 + 业务码），并归一为 `AppError`（`kind` / `code` / `httpStatus` / `message` / `traceId`），页面只处理 `kind`：

| `kind` | 触发 | 页面动作 |
|---|---|---|
| `unauthorized` | 401 / 业务码 40101 | 清会话 → `/login?redirect=...` |
| `forbidden` | 403 / 40301 | 按钮级提示或渲染 403 页 |
| `notFound` | 404 / 40401 | 详情页「记录不存在或已被删除」 |
| `validation` | 400 / 422 / 40001 | 字段级错误提示 |
| `conflict` | 409 / 40901 / 40902 | 「数据已变化」+ 刷新当前视图 |
| `business` | 其他业务拒绝 | Toast 领域文案 |
| `network` / `timeout` | 断网、超时 | 提示条 + 重试 |
| `server` / `unknown` | 5xx 及其他 | 通用失败提示 + 上报 Sentry |

### 5.2 业务码（`api/errors.ts` 单点映射）

| 码 | 语义 | `kind` |
|---|---|---|
| `0` | 成功 | — |
| `40001` | 参数错误 | `validation` |
| `40101` | 未登录 / 凭证失效（登录失败也用它） | `unauthorized` |
| `40301` | 无权限（含账号已禁用） | `forbidden` |
| `40401` | 资源不存在 | `notFound` |
| `40901` | 时段已满 | `conflict` |
| `40902` | 状态不允许该操作 | `conflict` |
| `40903` | 距服务开始不足 24 小时 | `business` |
| `40904` | 数据已存在 | `business` |
| `40905` | 数据被引用，无法删除 | `business` |
| `50000` | 系统异常 | `server` |

**文案优先级**：优先使用后端 `message`（如 40101 同时承载「未登录」与「手机号或密码错误」），缺失时才用前端兜底文案。未知码透传 `message` 并提示稍后重试。

### 5.3 鉴权与会话（`stores/session.ts`）

| 项 | 约定 |
|---|---|
| 登录流程 | `POST /auth/login` 取 token → 写入会话 → `GET /auth/me` 取用户 → 跳转；`/auth/me` 失败回滚会话 |
| 存储 | Zustand + `persist`，仅持久化 token 与用户摘要到 **sessionStorage**（关闭标签页失效，降低 XSS 长期驻留风险） |
| 请求头 | `Authorization: <token>`（`env.authHeader`，与后端 `sa-token.token-name` 一致） |
| 401 | 清会话并跳登录；**1 秒内并发 401 只处理一次**（`http.ts` 去重锁） |
| 403 | 不跳登录，按页面/按钮分别处理 |
| 登出 | 调接口（失败也继续本地清理）→ 清 Zustand 与 Query 缓存 |
| 回跳 | 只接受站内相对路径，过滤外链，防开放重定向 |

### 5.4 请求规范

GET 超时 10s、写操作 20s；`undefined`/`null`/空串参数不发送；外部 `AbortSignal` 可取消；写操作支持 `Idempotency-Key`；生产不打印响应体（含顾客手机号）。

### 5.5 已实现接口

> 后端 `Long` 统一序列化为**字符串**，前端一律按 `string` 处理；分页响应 `total/page/size` 也在 DTO 层转数字。

| 模块 | 接口 | 关键约定 |
|---|---|---|
| 认证 | `POST /auth/login`、`GET /auth/me`、`POST /auth/logout` | 登录**不返回**用户信息；角色仅接受 `STAFF` / `ADMIN` |
| 用户 | `GET/POST /admin/users`、`PUT/DELETE /admin/users/{id}`、`PUT /admin/users/{id}/password` | 查询 `page,size,keyword,role`；新增含 `phone,password,nickname,role,status`，编辑为局部更新；校验：手机号 `1[3-9]\d{9}`、姓名 ≤64、密码 6–32 位 |
| 服务项目 | `GET/POST /admin/service-items`、`PUT/DELETE /admin/service-items/{id}` | 查询 `page,size,keyword,status`；金额字段 `priceCents`/`depositCents` 为「分」的字符串，DTO 层转 `number` |
| 角色 | `GET/POST /admin/roles`、`PUT/DELETE /admin/roles/{id}` | 全局字典、不分页；内置角色（`ADMIN`/`STAFF`/`CUSTOMER`）不可删除；删除时角色下仍有用户会被拒绝 |

### 5.6 规划接口（占位页对应，以后端契约为准）

| 模块 | 接口（前缀 `/merchant`） |
|---|---|
| 资源 | `GET/POST /resources`、`PUT/DELETE /resources/{id}`、`PATCH /resources/{id}/status` |
| 排班 | `GET/POST /schedules`、`PUT/DELETE /schedules/{id}`（返回生成/变更后的槽位数） |
| 日历/时段 | `GET /calendar`、`GET /slots`、`POST /slots/{id}/lock`、`POST /slots/{id}/unlock` |
| 预约 | `GET /reservations`、`GET /reservations/{id}`、`POST /reservations`（代客下单）、`POST /reservations/{id}/cancel`、`POST /reservations/{id}/checkin` |
| 定金流水 | `GET /deposits`、`GET /deposits/{id}` |
| 审计 | `GET /audit-logs` |
| 工作台 | `GET /dashboard/today` |

契约变更流程：后端改 → Apifox 更新 → `types/` + `api/` 同步 → 联调确认后合并。DTO 与 ViewModel 的转换集中在 `api/*`（金额转整数分、时间归一、字段名适配），页面只消费 ViewModel。

## 6. 状态与数据流

| 状态类型 | 存放位置 | 说明 |
|---|---|---|
| 服务端状态 | TanStack Query | 统一缓存/失效/轮询，**不复制进 Zustand** |
| 会话状态 | Zustand（persist 最小集） | token、当前用户、角色 |
| 表单状态 | React Hook Form + Zod | 提交成功后重置或关闭 |
| 视图状态 | 组件内 `useState` | 抽屉开关、选中项等不可分享状态 |
| 列表参数 | URL | 分页、关键字、筛选，唯一事实来源 |

- **Query Key**：统一由 `api/queryClient.ts` 的 `queryKeys` 工厂生成（`session`、`users`、`services`、`roles`、`calendar`、`slots`、`reservations`、`deposits`、`auditLogs`、`dashboardToday` 等），参数对象键顺序固定。
- **默认策略**：`staleTime: 30s`、`refetchOnWindowFocus: true`、查询错误最多重试 1 次但**业务类错误不重试**、mutation 不重试。角色字典单独设 5 分钟 `staleTime`。
- **列表三件套**：`useListParams`（分页/关键字/筛选与 URL 双向同步）、`usePaginatedQuery`（`keepPreviousData`，翻页不闪白）、`useListPage`（组合上面两者 + 搜索草稿 + 分页配置 + 删除末条自动回退一页）。
- **变更联动**：`useInvalidate('<资源>')` 失效对应 key；例如角色变更同时失效 `roles` 与 `users`（用户列表要显示角色名）。

## 7. 关键业务规则落地

### 7.1 金额（单位：分）

| 项 | 规范 |
|---|---|
| 传输与计算 | 全部整数分（`number`），禁止除法与浮点参与业务计算 |
| 展示 | `MoneyText` / `formatMoney`：`¥1,280.00`，千分位 + 两位小数；空值 `—` |
| 输入 | 表单以「元」录入，`parseYuanToFen` 按小数点切分拼装（不经过浮点乘法），最多两位小数 |
| 汇总 | `sumFen` 先对整数分求和再一次性格式化 |
| 禁止 | `parseFloat` 解析金额、`toFixed` 参与后续计算、金额按字符串比较 |

### 7.2 时间与时区

- 全局固定 `Asia/Shanghai`（`utils/datetime.ts`），`now()` / `today()` 为唯一取时入口；日期 `YYYY-MM-DD`、时间 `HH:mm`、区间 `09:00–12:00`，跨天带日期前缀。
- 判定函数：`isBeyondLeadTime`（距开始 ≥ 24h）、`isBeforeCancelDeadline`（距开始 ≥ 24h）、`isPast`、`formatCountdown`（`1:58:31`）。
- 禁止 `new Date()` 参与业务判定、禁止用浏览器本地时区格式化。

### 7.3 关键时限

| 规则 | 前端表现 |
|---|---|
| 预约提前量 ≥ 24h | 不足 24h 的槽位灰化并提示「需提前 24 小时预约」；代客下单选中即校验并禁用提交，不弹错误 |
| 待支付 2h | 以服务端 `expiresAt` 为准，本地秒级倒计时（仅页面可见时运行）；≤10 分钟警示色，归零后刷新详情并提示「已超时关闭，时段已释放」 |
| 自助取消 ≥ 24h | 商户取消仅 ADMIN，不受 24h 阻断，但确认弹窗显示「距服务开始 X 小时」与退款说明 |

### 7.4 排班生成与时段锁定

- 排班保存后展示服务端返回的**实际生成槽位数**，并提供「查看日历」入口；已有预约的窗口不允许缩短/删除，引导改为锁定。
- 锁定 = 暂停售卖（不删除库存、不影响既有预约）；释放 = 恢复售卖。两者走乐观更新，失败回滚并提示「时段状态已变化，已刷新」。

### 7.5 核销与取消

- 核销仅 `CONFIRMED` 可发起：STAFF/ADMIN 发起后进入「等待顾客确认」子态（5 秒轮询 + 手动刷新），ADMIN 可代确认直接完成；重复提交视为成功，第一期不支持撤销。
- 取消/退款涉及资金与状态机，**不做乐观更新**，必须等服务端结果后刷新；`COMPLETED` / `CANCELLED` / `EXPIRED` / `REFUNDED` 下按钮不渲染。

### 7.6 状态机与 UI 映射（`constants/status.ts` 单一来源）

| 预约状态 | 中文 | 允许操作 |
|---|---|---|
| `PENDING_PAYMENT` | 待支付（2h 倒计时） | 取消（ADMIN）/ 查看 |
| `CONFIRMED` | 已确认（含等待顾客确认子态） | 核销 / 取消（ADMIN） |
| `COMPLETED` | 已完成 | 查看（只读） |
| `CANCELLED` / `EXPIRED` | 已取消 / 已过期 | 查看 |
| `REFUNDING` / `REFUNDED` | 退款中 / 已退款 | 查看 |

| 定金流水状态 | 中文 |
|---|---|
| `PENDING` / `SUCCESS` / `REFUNDED` / `FAILED` / `EXPIRED` | 待支付 / 支付成功 / 已退款 / 支付失败 / 已关闭 |

| 时段派生状态（日历渲染） | 判定 |
|---|---|
| 可售 / 已满 | 未锁定且 `used < total` / `used >= total` |
| 已锁定 | 锁定标记为真（显示备注） |
| 不可预约 / 已过期 | 距开始 < 24h / 结束时间已过 |

**一致性规则**：操作可用性 = 状态映射 ∧ 角色权限，任一不满足即不渲染按钮；状态文案与颜色只来自映射表，页面不得自写 `if` 与色值。

## 8. 日历与时段库存视图（M3 待实现）

| 项 | 设计 |
|---|---|
| 视图 | 日视图（默认，时间轴 × 资源泳道）、周视图简化版；日期/视图/筛选写入 URL |
| 数据 | 一次请求取回可见范围槽位，内存装配泳道模型：`laneKey`、`startMinutes/endMinutes`、`total/used`、`locked/lockNote`、`reservations`、`derivedState` |
| 渲染 | 自建 CSS Grid + 绝对定位；默认 15 分钟粒度（`VITE_SLOT_GRAIN_MINUTES`），表头每小时标注；泳道 160px，≥6 条横向滚动；当前时间线仅今日显示 |
| 交互 | 点击/右键打开槽位抽屉（余量、关联预约、锁定/释放）；Tooltip 显示 `09:00–10:00 · 已用 1/2`；不做拖拽改期 |
| 性能 | 泳道与槽位分别 memo；>20 条泳道横向窗口化；30 秒轮询仅刷新数据且页面不可见时暂停；单日槽位 >1000 触发告警并降级 |
| 异常 | 无排班/无资源空态引导；加载失败保留上次数据 + 顶部错误条 + 重试；显示「更新于 HH:mm:ss」 |

## 9. 页面清单

| 页面 | 路由 | 状态 | 要点 |
|---|---|---|---|
| 登录 | `/login` | 已实现 | 左品牌区 + 右表单（「雅奢 Morandi」视觉）；账号/密码必填、密码可切换可见；提交中按钮 loading 并展示后端错误文案；成功后按站内 `redirect` 回跳（正则白名单），否则 `/calendar`；token 与用户信息齐备时自动跳首页 |
| 用户管理 | `/users` | 已实现 | 关键字（姓名/手机号）+ 角色筛选（角色字典复用 `useRolesQuery`）；新增/编辑抽屉（可分配角色）、启用/停用开关（停用二次确认）、重置密码弹窗、逻辑删除；顾客账号 `merchantId` 为空显示「全局」 |
| 服务项目 | `/services` | 已实现 | 关键字 + 上下架筛选；列表展示时长、价格、定金（`MoneyText`/`DurationText`）；抽屉表单录入（元→分）；上下架开关（下架二次确认）、删除二次确认；写操作按 `service:write` 渲染 |
| 角色管理 | `/roles` | 已实现 | 角色字典 CRUD（内置角色禁删、仍有用户时拒绝）；下方「内置角色权限范围」表只读展示 `ROLE_PERMISSIONS` 常量矩阵 |
| 工作台 | `/dashboard` | 占位 | 指标卡 + 余量紧张时段 + 待处理清单，60s 轮询 |
| 日历 | `/calendar` | 占位 | 见 §8 |
| 排班 | `/schedules` | 占位 | 日期区间 + 资源筛选；窗口表单；保存展示生成槽位数 |
| 资源 | `/resources` | 占位 | 技师/床位 Tab；停用/删除展示影响面 |
| 预约列表 | `/reservations` | 占位 | 状态/日期/资源/服务/关键词筛选 + 快捷 Tab；行内核销、取消 |
| 预约详情 | `/reservations/:id` | 占位 | 基本信息 + 状态时间线 + 操作栏 + 定金摘要 |
| 定金流水 | `/deposits` | 占位 | 筛选 + 期间小计 + 只读列表 |
| 审计日志 | `/audit-logs` | 占位 | 动作类型/日期/操作人筛选，详情抽屉，只读 |

## 10. 交互规范

| 场景 | 规范 |
|---|---|
| 应用外壳 | 侧边导航展开 232px / 折叠 64px + 顶栏 56px + 内容区 24px 内边距；日历页取消最大宽度限制，横向铺满 |
| 首屏/列表加载 | 骨架屏且布局一致；翻页/筛选保留上一页数据 + 局部 loading，不整页闪白 |
| 空态 | 插图 + 一句原因 + 一个主操作；筛选无结果显示「清空筛选」 |
| 错误 | 按 §5.1 的 `kind` 处理；页面级保留上次数据 + 错误条 + 重试；同一失败只提示一次（接入层只抛错，不弹提示） |
| 表单 | 抽屉内单列，标签右对齐 96px；失焦校验单字段 + 提交全量校验；服务端字段错误映射到字段；脏表单离开二次确认；提交 loading + 成功后关闭并刷新 |
| 危险操作 | `DangerConfirm`：取消预约、代确认核销、删除服务/资源、停用/下架、锁定已有预约的槽位、重置密码，均说明影响面 |
| 反馈通道 | `message` 成功与可自愈失败；`notification` 批量/后台结果；内联错误条页面级失败；`modal` 仅用于确认；`drawer` 保留上下文 |
| 文案 | 中文全角标点；术语统一「预约单/时段/余量/核销/定金/排班/资源」；状态词与 §7.6 一致；空值 `—` |

## 11. 质量与性能

### 11.1 CI 阻断项

`tsc --noEmit` 零错误（`strict`）｜ESLint 零 error（`no-explicit-any` 为 error）｜Prettier check 通过｜`pnpm build` 成功且主 chunk 不超预算｜依赖无 high/critical 漏洞。

### 11.2 体积与性能预算

| 项 | 预算 | 说明 |
|---|---|---|
| 主 chunk（react + router + query + 外壳） | ≤ 125KB gzip | 实测约 116KB |
| antd 相关（含按需 icons） | ≤ 210KB gzip | 实测约 190KB |
| 单页 chunk | ≤ 60KB | 常规页面保持在该值以内 |
| 首屏合计 | ≈ 316KB gzip | 登录页的 Zod/RHF 只在 `/login` 加载 |

性能目标：FCP < 1.2s、LCP < 1.8s、INP < 200ms、CLS < 0.05、路由切换 < 300ms、槽位交互反馈 < 100ms。手段：路由级懒加载与菜单预取、图标命名导入、列表统一 20 条分页、日历一次取数不按资源串行、系统字体栈不加载 Web Font。

## 12. 部署与本地开发

### 12.1 Nginx 要点

`try_files $uri $uri/ /index.html` 支持 SPA 路由｜`/api` 反代 `app:8080`（透传鉴权头与 `X-Request-Id`）｜`index.html` 不缓存、带 hash 的 `assets/*` 长缓存｜`location ~* \.map$ { deny all; }`（map 仅上传 Sentry）｜开启 gzip｜下发 CSP、`X-Content-Type-Options`、`X-Frame-Options: DENY`、`Referrer-Policy`。

### 12.2 环境变量（仅非敏感配置）

| 变量 | 默认/示例 | 用途 |
|---|---|---|
| `VITE_API_BASE_URL` | `/api/v1` | 接口前缀（同域反代） |
| `VITE_APP_ENV` | `dev` / `staging` / `prod` | 环境标识与 Sentry 环境 |
| `VITE_SENTRY_DSN` | — | 留空则不上报 |
| `VITE_POLL_INTERVAL_MS` | `30000` | 日历/列表轮询间隔 |
| `VITE_SLOT_GRAIN_MINUTES` | `15` | 日历时间轴粒度 |
| `VITE_APP_VERSION` | `0.0.0` | 版本号，登录页与错误上报携带 |

### 12.3 本地运行

环境要求：Node ≥ 20.19、pnpm 11.x。

| 命令 | 作用 |
|---|---|
| `pnpm install` | 安装依赖（首次需在 `pnpm-workspace.yaml` 放行 esbuild 构建脚本） |
| `pnpm dev` | 开发服务器 <http://localhost:5173>，`/api` 代理到 `http://localhost:8080` |
| `pnpm build` | `tsc --noEmit` + `vite build`，产物在 `dist/` |
| `pnpm preview` | 预览产物（<http://localhost:4173>） |
| `pnpm typecheck` / `pnpm lint` / `pnpm format` | 类型检查 / ESLint / Prettier（`lint:fix`、`format:check` 同理） |

联调：先启动后端 `app`（8080）再用种子账号登录；接口未就绪的占位页会停留在错误提示态，属预期。

## 13. 路线图与待确认

| 里程碑 | 范围 |
|---|---|
| M1 基础域 | 用户/角色/服务已完成；资源管理待做 |
| M2 排班 | 排班列表与表单、生成结果反馈 |
| M3 日历核心 | 日视图（泳道 + 槽位 + 抽屉）、锁定/释放、周视图简化版 |
| M4 预约闭环 | 列表、详情、核销（两种模式）、取消退款、代客下单 |
| M5 流水与审计 | 定金流水、审计日志、工作台 |
| M6 联调验收 | 真实接口联调、性能与安全收口、部署上线 |

待确认（前端临时取向）：

1. 定金流水对 STAFF 开放只读、是否支持导出。
2. 核销的顾客确认是否强制、能否撤销核销。
3. 是否需要批量核销/批量锁定。
4. 排班是否支持周模板与跨天窗口（22:00–次日 02:00）。
5. 自定义角色是否需要可配置权限点（当前后端仅按角色代码粗粒度校验，矩阵为前端常量）。
6. 分页字段命名与多门店切换（第二期）。
