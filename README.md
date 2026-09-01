# 折纸图片管理后台（Zhe Picture Management System）

一套前后端分离的在线图片素材管理与协同编辑平台，支持公开图库、私有/团队空间、AI 扩图、空间维度分表、WebSocket 实时协同编辑等能力。

---

## 一、项目简介

### 背景

在日常工作学习中，图片素材分散存储、检索困难、协作低效。本项目希望构建一个**面向个人与团队的一站式图片管理平台**：既能作为公开素材库沉淀优质图片，也能为团队提供独立的私有空间与精细化权限控制，并借助 AI 与协同编辑能力提升素材处理效率。

### 核心功能

- **图片素材管理**：上传、删除、编辑、审核、分类、标签、缩略图、主色调提取。
- **空间隔离**：支持公共空间 + 私有/团队空间，不同空间拥有独立的容量与数量额度。
- **权限体系**：基于 Sa-Token 的角色鉴权 + 空间成员角色（viewer/editor/admin）细粒度权限。
- **批量与智能能力**：批量上传、批量编辑、按颜色搜索、阿里云 AI 扩图。
- **协同编辑**：WebSocket + Disruptor 实现图片详情页实时编辑消息同步。
- **数据分片**：图片表按 `spaceId` 动态分表，支撑空间级数据水平扩展。
- **多级缓存**：Caffeine 本地缓存 + Redis 分布式缓存加速公开图库访问。

### 目标用户

- 个人开发者 / 设计师：沉淀与管理个人素材库。
- 小型团队：共享图片资产、按角色分配管理权限。
- 后端学习者：了解分库分表、权限模型、缓存、WebSocket、AI 接入等实践。

---

## 二、核心功能模块

| 模块 | 说明 |
|------|------|
| 用户模块 | 注册、登录、登出、当前登录用户、管理员用户管理 |
| 图片模块 | 单张/URL 上传、批量上传、图片审核、CRUD、按颜色搜索、AI 扩图、批量编辑 |
| 空间模块 | 创建空间、空间等级与额度、空间编辑删除、空间分析 |
| 空间成员模块 | 添加/移除成员、角色分配（viewer/editor/admin）、我加入的团队空间 |
| 空间分析模块 | 容量/分类/标签/大小/用户行为/排行榜多维分析 |
| 文件模块 | 腾讯云 COS 文件上传/下载测试接口 |
| 协同编辑模块 | WebSocket 实时编辑消息，基于 Disruptor 无锁队列处理 |

---

## 三、技术栈

### 后端

- **框架**：Spring Boot 2.6.13
- **JDK**：Java 8
- **持久层**：MyBatis-Plus 3.5.9、MySQL 8、Flyway
- **数据库中间件**：ShardingSphere-JDBC 5.2.0（图片表按 `spaceId` 分表）
- **缓存**：Redis + Caffeine 本地缓存
- **认证鉴权**：Sa-Token 1.45.0 + Redis
- **对象存储**：腾讯云 COS
- **AI 能力**：阿里云图像生成/扩图 API
- **实时通信**：Spring WebSocket + Disruptor 无锁队列
- **工具库**：Hutool、Lombok、Knife4j、jsoup
- **构建工具**：Maven

### 前端

- **框架**：Vue 3 + TypeScript
- **构建工具**：Vite
- **UI 组件库**：Element Plus
- **状态管理**：Pinia
- **路由**：Vue Router
- **图表**：ECharts

---

## 四、项目结构

```text
zhe-picture-backend/
├── frontend/                          # 前端工程（Vue 3 + TS + Vite）
│   ├── src/
│   │   ├── api/                       # Axios 接口封装
│   │   ├── components/                # 业务组件
│   │   ├── composables/               # WebSocket 等组合式逻辑
│   │   ├── router/                    # 路由配置
│   │   ├── store/                     # Pinia 状态管理
│   │   ├── types/                     # TypeScript 类型定义
│   │   ├── utils/                     # 工具函数
│   │   └── views/                     # 页面视图
│   └── package.json
├── sql/
│   └── create_database.sql            # 首次部署创建数据库（表结构由 Flyway 管理）
├── src/main/java/com/sdfkl/zhepicturebackend/
│   ├── annotation/                    # 自定义注解（如管理员鉴权）
│   ├── aop/                           # AOP 拦截器
│   ├── api/aliyunai/                  # 阿里云 AI 扩图 API 封装
│   ├── common/                        # 通用返回、分页、结果工具
│   ├── config/                        # 跨域、MyBatis-Plus、Jackson 等配置
│   ├── constant/                      # 常量
│   ├── controller/                    # Web 控制器
│   ├── exception/                     # 全局异常与错误码
│   ├── manager/                       # 业务管理器
│   │   ├── auth/                      # Sa-Token 权限配置与空间权限模型
│   │   ├── sharding/                  # 分片算法与动态分表管理
│   │   ├── upload/                    # 图片上传模板
│   │   └── websocket/                 # WebSocket 配置与 Disruptor 处理
│   ├── mapper/                        # MyBatis Mapper 接口
│   ├── model/                         # DTO / Entity / VO / Enum
│   ├── service/                       # 业务接口与实现
│   └── utils/                         # 颜色计算、颜色转换等工具
├── src/main/resources/db/migration/   # Flyway 版本化迁移脚本
└── pom.xml
```

---

## 五、数据库设计（核心表结构）

数据库名：`zhe_picture`

### 1. 用户表 `user`

| 字段 | 类型 | 说明 |
|------|------|------|
| id | bigint | 主键 |
| userAccount | varchar(256) | 账号，唯一 |
| userPassword | varchar(512) | 加密密码 |
| userName | varchar(256) | 昵称 |
| userAvatar | varchar(1024) | 头像 URL |
| userProfile | varchar(512) | 简介 |
| userRole | varchar(256) | 角色：user / admin |
| editTime / createTime / updateTime | datetime | 时间戳 |
| isDelete | tinyint | 逻辑删除 |

### 2. 图片表 `picture`

| 字段 | 类型 | 说明 |
|------|------|------|
| id | bigint | 主键 |
| url | varchar(512) | 原图 URL |
| thumbnailUrl | varchar(512) | 缩略图 URL |
| objectKey / thumbnailObjectKey / compressedObjectKey | varchar(512) | COS 原图、缩略图、压缩图对象 key |
| uploadStatus | varchar(32) | `UPLOADING` / `READY` / `FAILED` / `DELETE_PENDING` |
| contentType / etag / version | - | 实际内容类型、COS 校验标识、乐观锁版本 |
| idempotencyKey | varchar(128) | 上传请求幂等号 |
| name | varchar(128) | 图片名称 |
| introduction | varchar(512) | 简介 |
| category | varchar(64) | 分类 |
| tags | varchar(512) | 标签 JSON 数组 |
| picSize / picWidth / picHeight / picScale / picFormat | - | 图片元信息 |
| picColor | varchar(16) | 图片主色调 |
| userId | bigint | 创建用户 ID |
| spaceId | bigint | 所属空间 ID，为空表示公共空间 |
| reviewStatus | int | 审核状态：0-待审核 / 1-通过 / 2-拒绝 |
| reviewMessage / reviewerId / reviewTime | - | 审核相关信息 |
| createTime / editTime / updateTime | datetime | 时间戳 |
| isDelete | tinyint | 逻辑删除 |

图片表的常用组合索引包括：

- `(spaceId, reviewStatus, isDelete)`：空间图片审核列表
- `(spaceId, editTime)`：空间图片按编辑时间排序
- `(userId, createTime)`：用户图片按创建时间查询

> 图片表按 `spaceId` 使用 ShardingSphere 动态分表，空间级查询路由到对应分表。

### 3. 空间表 `space`

| 字段 | 类型 | 说明 |
|------|------|------|
| id | bigint | 主键 |
| spaceName | varchar(128) | 空间名称 |
| spaceLevel | int | 等级：0-普通版 / 1-专业版 / 2-旗舰版 |
| spaceType | int | 类型：0-私有 / 1-团队 |
| maxSize / maxCount | bigint | 最大容量与数量 |
| totalSize / totalCount | bigint | 当前已用容量与数量 |
| reservedSize / reservedCount | bigint | 上传中的容量与数量预留 |
| userId | bigint | 创建者 ID |
| createTime / editTime / updateTime | datetime | 时间戳 |
| isDelete | tinyint | 逻辑删除 |

### 4. 空间成员表 `space_user`

| 字段 | 类型 | 说明 |
|------|------|------|
| id | bigint | 主键 |
| spaceId | bigint | 空间 ID |
| userId | bigint | 用户 ID |
| spaceRole | varchar(128) | 空间角色：viewer / editor / admin |
| createTime / updateTime | datetime | 时间戳 |

### 5. AI 任务表 `ai_task`

| 字段 | 类型 | 说明 |
|------|------|------|
| id | bigint | 主键 |
| provider / provider_task_id | varchar | AI 服务商及第三方任务 ID |
| user_id / picture_id / space_id | bigint | 用户、源图片和空间归属 |
| status | varchar(32) | 本地任务状态 |
| output_url | varchar(1024) | 生成结果 URL |
| idempotency_key | varchar(128) | 用户级请求幂等号 |
| error_message | varchar(512) | 失败原因 |
| request_id / model | varchar | 第三方请求和模型信息 |
| cost_amount / currency | decimal/varchar | 调用费用和币种 |
| create_time / update_time | datetime | 时间戳 |

AI 任务查询必须先按当前用户过滤，再使用第三方任务 ID 查询；管理员可查询全局任务。标签短期继续保存为 JSON，后续拆分为标签表时应结合图片动态分表策略增加空间路由字段。

AI 提交结果不确定时，服务端不会自动换幂等号重试：`CREATING` 任务超过
`AI_TASK_RECOVERY_CREATING_TIMEOUT_MS` 后由后台扫描转为 `UNKNOWN`。管理员可通过
`GET /api/aiTask/admin/unresolved` 查看无第三方任务 ID 的异常任务；确认第三方未创建任务后，调用
`POST /api/aiTask/admin/retry` 将任务标记为 `RETRYABLE`，用户随后必须使用原 `Idempotency-Key`
重新提交。若能从第三方日志或控制台找回 taskId，应调用
`POST /api/aiTask/admin/bind` 绑定任务，禁止直接换幂等号重试。

数据库表结构由 `src/main/resources/db/migration/` 下的 Flyway 脚本管理，当前迁移版本为 V11。

---

## 六、核心接口文档

项目集成 **Knife4j（Swagger）** 接口文档，启动后端后访问：

```
http://localhost:8123/api/doc.html
```

主要接口前缀：

| 模块 | 前缀 |
|------|------|
| 用户模块 | `/api/user` |
| 图片模块 | `/api/picture` |
| 空间模块 | `/api/space` |
| 空间分析 | `/api/space/analyze` |
| 空间成员 | `/api/spaceUser` |
| 文件模块 | `/api/file` |
| WebSocket | `/api/ws/picture/edit` |

### 部分关键接口示例

- `POST /api/user/register`：用户注册（当前需管理员角色）
- `POST /api/user/login`：用户登录
- `GET /api/user/get/login`：获取当前登录用户
- `POST /api/picture/upload`：图片文件上传
- `POST /api/picture/upload/url`：通过 URL 上传图片
- `POST /api/picture/list/page/vo`：分页查询图片（公开/空间）
- `POST /api/picture/search/color`：按颜色搜索图片
- `POST /api/picture/out_painting/create_task`：创建 AI 扩图任务
- `GET /api/picture/out_painting/get_task`：查询当前用户有权访问的 AI 扩图任务
- `POST /api/picture/review`：管理员审核图片
- `POST /api/space/add`：创建空间
- `POST /api/space/analyze/usage`：空间使用情况分析
- `POST /api/spaceUser/add`：添加空间成员

图片上传建议在请求头中携带唯一的 `Idempotency-Key`。同一个幂等号只代表一次上传操作；成功后重复请求会返回原结果，失败或处理中请更换幂等号。上传完成后的缩略图和压缩图由 Outbox Worker 异步生成。

AI 扩图创建接口必须携带 `Idempotency-Key` 请求头。服务端会把任务归属、第三方任务 ID、状态和结果写入 `ai_task`，重复请求会返回同一个第三方任务；客户端在网络失败或结果未知时必须复用原幂等号重试，不能静默更换幂等号。

孤儿对象扫描默认关闭，确认历史对象 key 已迁移且 COS 前缀配置正确后，再设置
`PICTURE_ORPHAN_SCAN_ENABLED=true` 开启。对象删除、失败补偿和衍生图生成由 Outbox Worker
自动重试，`OUTBOX_WORKER_MAX_RETRIES` 可调整最大重试次数。

---

## 七、快速启动

### 环境要求

- JDK 1.8+
- Maven 3.6+
- MySQL 8.0+
- Redis 5.0+
- Node.js 18+（前端）

### 配置步骤

#### 1. 克隆项目

```bash
git clone https://github.com/sdfkl/zhe-picture-backend.git
cd zhe-picture-backend
```

#### 2. 创建数据库并执行迁移

```bash
mysql -u root -p < sql/create_database.sql
mvn spring-boot:run
```

应用启动时 Flyway 会自动按 V1～V11 执行迁移。不要再手工执行旧版 `create_table.sql` 或阶段迁移脚本。

已有数据库首次接入 Flyway 时，必须先备份并核对当前库已经包含用户、空间、图片和空间成员基础表。V8 会为旧图片表（包括 `picture_{spaceId}` 分表）补齐第二阶段上传字段和空间预留字段。确认后仅在第一次启动时设置：

```powershell
$env:FLYWAY_BASELINE_ON_MIGRATE = "true"
$env:FLYWAY_BASELINE_VERSION = "4"
mvn spring-boot:run
```

启动成功后移除 `FLYWAY_BASELINE_ON_MIGRATE`，后续由 Flyway 继续执行 V5～V11。数据库结构不确定时不要直接 baseline，应先在测试库演练迁移。

#### 3. 配置本地环境

复制 `application-local.example.yml` 为
`src/main/resources/application-local.yml`。该文件已被 Git 忽略，不能提交到仓库。

所有密码和服务凭证都通过本机环境变量注入，变量名如下：

| 环境变量 | 用途 |
| --- | --- |
| `DB_PASSWORD` | MySQL 和分片数据源密码 |
| `DB_USERNAME` | MySQL 用户名，默认 `root` |
| `DB_URL` | MySQL 连接地址，默认使用 `zhe_picture` 数据库 |
| `REDIS_PASSWORD` | Redis 密码 |
| `COS_SECRET_ID` | 腾讯云 COS SecretId |
| `COS_SECRET_KEY` | 腾讯云 COS SecretKey |
| `ALIYUN_API_KEY` | 阿里云 AI API Key |
| `COS_HOST` / `COS_REGION` / `COS_BUCKET` | COS 非敏感连接参数 |
| `APP_CORS_ALLOWED_ORIGINS` | 允许访问后端的浏览器来源，多个来源用英文逗号分隔，禁止使用 `*` |
| `SA_TOKEN_COOKIE_SECURE` | 是否为登录 Cookie 设置 `Secure`；HTTPS 生产环境必须为 `true` |
| `SA_TOKEN_COOKIE_SAMESITE` | 登录 Cookie 的 SameSite 策略，生产默认使用 `Lax` |
| `AI_TASK_RECOVERY_FIXED_DELAY_MS` | AI 异常任务扫描间隔，默认 60 秒 |
| `AI_TASK_RECOVERY_CREATING_TIMEOUT_MS` | `CREATING` 任务转为 `UNKNOWN` 的等待时间，默认 15 分钟 |

不要把真实凭证写入 `application.yml`、`application-local.yml`、`.env`、README 或提交信息。
凭证泄露后应立即在云平台禁用并重新创建，不能只依赖删除工作区文件。

如需开启图片表分片，请确保数据库中已创建对应分表（如 `picture_1`、`picture_2`），或在 `PictureShardingAlgorithm` 中调整默认路由策略。

#### 4. 启动后端

```bash
mvn clean install -DskipTests
mvn spring-boot:run
```

或直接运行 `ZhePictureBackendApplication`。

后端启动后，访问：

```
http://localhost:8123/api/doc.html
```

#### 5. 启动前端

```bash
cd frontend
npm install
npm run dev
```

默认访问地址：`http://localhost:5173`

#### 6. 同源部署与反向代理

方案 B 默认让浏览器只访问当前站点的 `/api` 和 WebSocket 路径：开发环境由 Vite 代理到
`http://localhost:8123`，生产环境由 Nginx 等反向代理转发到后端。这样登录 Cookie、普通接口和 WebSocket
共享同一站点，减少跨域和 Cookie 属性不一致导致的问题。

Nginx 配置示例见 `deploy/nginx/picture.conf.example`。代理必须保留 `/api` 前缀，并转发
`Upgrade`、`Connection`、`Host`、`X-Forwarded-For` 和 `X-Forwarded-Proto` 请求头。

生产环境示例：

```text
APP_CORS_ALLOWED_ORIGINS=https://picture.example.com
SA_TOKEN_COOKIE_SECURE=true
SA_TOKEN_COOKIE_SAMESITE=Lax
```

本地开发示例：

```text
APP_CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
SA_TOKEN_COOKIE_SECURE=false
SA_TOKEN_COOKIE_SAMESITE=Lax
```

启用 Cookie 凭证时不要把 `APP_CORS_ALLOWED_ORIGINS` 配置为 `*`。如果前端开发服务器不在本机，
可以设置 `DEV_API_TARGET` 指向可访问的后端地址，Vite 会同时代理 HTTP 和 WebSocket 请求。

### 访问测试

1. 打开 `http://localhost:5173` 进入登录页。
2. 使用管理员账号登录（初始可通过数据库插入用户，密码为 MD5 加密后的结果；管理员添加用户的默认密码为 `19880314`）。
3. 测试图片上传、空间创建、成员邀请、颜色搜索、AI 扩图等功能。
4. 多开浏览器标签页进入同一张图片详情页，测试 WebSocket 协同编辑消息。
5. 浏览器开发者工具中确认接口请求为当前站点的 `/api/...`，WebSocket 地址为当前站点的
   `ws://.../api/ws/picture/edit` 或 `wss://.../api/ws/picture/edit`。
6. 使用未配置的来源访问时，HTTP 预检和 WebSocket 握手都应被拒绝。

---

## 八、项目亮点

- **前后端分离**：后端专注于接口与业务能力，前端基于 Vue 3 + Element Plus 提供流畅交互。
- **空间级数据隔离与分片**：图片表按 `spaceId` 动态分表，兼顾公共空间查询与私有空间扩展。
- **多级缓存架构**：Caffeine + Redis 两级缓存提升公开图库查询性能，并设置随机过期时间防止缓存雪崩。
- **细粒度权限控制**：Sa-Token 统一登录态，空间内角色区分 viewer/editor/admin，关键操作通过注解鉴权。
- **AI 能力接入**：集成阿里云 AI 扩图，支持图片智能外绘。
- **实时协同编辑**：WebSocket 结合 Disruptor 无锁队列处理编辑事件，支持多人协同场景。
- **空间多维分析**：提供容量、分类、标签、大小、用户行为、排行榜等分析视图。
- **对象存储与缩略图**：图片资源存储于腾讯云 COS，支持缩略图与主色调提取。

---

## 九、待优化项

- [ ] 注册接口当前限定管理员角色，后续支持公开注册 + 邮箱/短信验证码。
- [ ] 引入分布式锁（Redisson）防止空间额度、图片审核等并发场景下的数据不一致。
- [ ] 图片审核从人工审核升级为 AI 内容安全自动审核。
- [ ] 补齐单元测试与接口自动化测试覆盖。
- [ ] 引入 Elasticsearch 提升图片全文检索与标签聚合性能。
- [ ] 分表环境下完善动态建表与分表迁移工具。
- [ ] 前端补充图片懒加载、虚拟滚动、PWA 离线能力。

---

## 十、关于我

- **GitHub 主页**：[https://github.com/ihyam30/zhe-picture-backend](https://github.com/sdfkl)
- **为什么做这个项目**：
  我希望通过一个完整的全栈项目，把 Java 后端开发中常用的技术栈——Spring Boot、MyBatis-Plus、Redis、权限认证、分库分表、WebSocket、对象存储、AI 接口接入等——串联起来，同时也练习 Vue 3 前端工程化开发。图片管理是一个贴近实际业务、需求清晰、扩展性强的场景，非常适合作为个人技术沉淀与面试展示项目。
