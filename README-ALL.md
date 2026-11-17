# 预约 \+ 定金 \+ 排班系统 · 轻量技术文档



> 文档状态：草稿 / 评审中 / 已冻结
> 
> 最后更新：YYYY\-MM\-DD
> 
> 关联文档：轻量需求说明 v0\.1、实体关系草图、定金状态机图、OpenAPI 契约
> 
> 适用读者：自己（全栈开发）、后续接手的开发者、AI 编码助手
> 
> 



---



## 1\. 概述（必填）



### 1\.1 项目一句话

为单人/少人服务商户（美容、美甲、宠物美容、私教、家政等）提供“预约 \+ 定金 \+ 排班”的轻量Saas服务系统。



### 1\.2 技术文档的目标

本文档锁定系统架构、数据模型、核心业务规则的技术实现方式、接口契约与部署方案，作为编码、联调和验收的依据。



### 1\.3 与需求文档的边界

- 需求文档定义：角色、核心闭环、业务规则、验收标准、范围外事项。

- 本文档定义：技术选型、数据模型、状态机实现、并发与幂等方案、API 契约、权限、部署与测试策略。

- 本文档不重复需求文档中的业务规则原文，只引用并说明“如何实现”。

    

---



## 2\. 架构总览（必填）



### 2\.1 系统上下文

用一段话或一张简图说明：

- 顾客端（小程序/移动H5）

- 商户后台（web/桌面）

- 后端 API

- 数据库

- 支付回调入口（演示环境可模拟）

- 定时任务（超时释放、提醒）

    

### 2\.2 架构图

（粘贴 Mermaid / draw\.io / 手绘照片均可）



### 2\.3 关键架构决策

|决策|选择|理由|备选方案与放弃原因|
|---|---|---|---|
|前后端组织|独立后端 API / Next\.js API Routes|展示后端设计能力 / 压缩工期|\.\.\.|
|数据库|PostgreSQL|事务与唯一约束防超卖|\.\.\.|
|时段库存|独立库存表 \+ 原子条件更新|避免聚合查询实时算余量|Redis 原子扣减|
|认证|Supabase Auth / NextAuth|不手写登录|\.\.\.|



---



## 3\. 技术栈（必填）



|层|选型|版本|用途|备注|
|---|---|---|---|---|
|前端框架|React \+ TypeScript \+ Taro|19\.x|顾客端 \+ 商户后台||
|样式|Tailwind CSS|4\.x|设计令牌落地||
|后端|Java Spring Boot|4\.1\.x|业务 API||
|ORM|MyBatis\-Plus|3\.5\.9\+|数据建模与迁移|后台 CRUD 与复杂查询兼顾；配合 Flyway 做表结构迁移|
|数据库|MySQL|8\.0|主数据存储||
|认证|Sa\-Token|1\.45\.0\+|顾客与商户登录|已适配 Spring Boot 4，轻量注解式鉴权|
|部署|Docker Compose \+ Nginx \+ 云服务器|Docker CE 24\.x\+ / Nginx 1\.27|前端静态 \+ 后端 API \+ MySQL|Nginx 托管前端并反代 `/api`；app 只 expose 不映射宿主机|
|定时任务|Spring @Scheduled|Spring Boot 4\.1 内置|超时释放、提醒|单机演示足够；显式指定 `zone = "Asia/Shanghai"`|
|设计|Stitch → Figma|\.\.\.|界面初稿与设计令牌|中文界面|
|数据库迁移|Flyway|10\.x\+|表结构版本管理|与 Spring Boot 4 集成，避免手动改表漂移|
|接口文档|Apifox|-|生成 API 契约|接口文档|



---



## 4\. 领域模型与数据库设计（必填）



### 4\.1 实体清单

- merchant（商户，演示单租户但预留 merchant\_id）

- staff / resource（人力与物理资源分层）

- service（服务项目）

- schedule（排班/可售窗口）

- slot\_inventory（时段库存，独立成行）

- reservation（预约单）

- deposit\_transaction（定金流水）

- audit\_log（关键操作审计，可选但建议）

    

### 4\.2 实体关系图

（粘贴 ER 图）



### 4\.3 表结构定义

逐表列出关键字段、类型、约束、索引。示例：



#### slot\_inventory

|字段|类型|约束|说明|
|---|---|---|---|
|id|uuid|PK||
|merchant\_id|uuid|FK, NOT NULL|多租户预留|
|resource\_id|uuid|FK, NOT NULL|资源|
|slot\_date|date|NOT NULL|日期|
|start\_time|time|NOT NULL|开始|
|end\_time|time|NOT NULL|结束|
|total|int|NOT NULL, \>=0|总库存|
|used|int|NOT NULL, \>=0|已占用|
|version|int|NOT NULL default 0|乐观锁可选|
|UNIQUE|\(resource\_id, slot\_date, start\_time\)||防重复建槽|



> 其余表按同样格式列出。重点写清楚唯一约束、外键、状态字段、金额字段（分为单位存整数）。
> 
> 



### 4\.4 数据迁移与种子数据

- 迁移工具：Prisma Migrate / Drizzle Kit

- 种子数据：演示商户、3 个服务、2 个资源、未来 7 天排班

- 迁移回滚策略：\.\.\.

    

---



## 5\. 核心业务技术设计（必填，最重要）



### 5\.1 时段库存并发扣减

- 方案：数据库原子条件更新

- SQL 示意：

    ```SQL
    UPDATE slot_inventory
    SET used = used + 1
    WHERE id = $1 AND used < total;
    ```

    

