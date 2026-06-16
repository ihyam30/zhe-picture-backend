折纸图片管理后台（Zhe Picture Management System）

一套前后端分离的在线图片素材管理与协同编辑平台，支持公开图库、私有/团队空间、AI 扩图、空间维度分表、WebSocket 实时协同编辑等能力。

---

一、项目简介

背景

在日常工作学习中，图片素材分散存储、检索困难、协作低效。本项目希望构建一个面向个人与团队的一站式图片管理平台：既能作为公开素材库沉淀优质图片，也能为团队提供独立的私有空间与精细化权限控制，并借助 AI 与协同编辑能力提升素材处理效率。

核心功能

- 图片素材管理：上传、删除、编辑、审核、分类、标签、缩略图、主色调提取。
- 空间隔离：支持公共空间 + 私有/团队空间，不同空间拥有独立的容量与数量额度。
- 权限体系：基于 Sa-Token 的角色鉴权 + 空间成员角色（viewer/editor/admin）细粒度权限。
- 批量与智能能力：批量上传、批量编辑、按颜色搜索、阿里云 AI 扩图。
- 协同编辑：WebSocket + Disruptor 实现图片详情页实时编辑消息同步。
- 数据分片：图片表按 spaceId 动态分表，支撑空间级数据水平扩展。
- 多级缓存：Caffeine 本地缓存 + Redis 分布式缓存加速公开图库访问。

目标用户

- 个人开发者 / 设计师：沉淀与管理个人素材库。
- 小型团队：共享图片资产、按角色分配管理权限。
- 后端学习者：了解分库分表、权限模型、缓存、WebSocket、AI 接入等实践。

---

二、核心功能模块

  模块    	说明                                      
  用户模块  	注册、登录、登出、当前登录用户、管理员用户管理                 
  图片模块  	单张/URL 上传、批量上传、图片审核、CRUD、按颜色搜索、AI 扩图、批量编辑
  空间模块  	创建空间、空间等级与额度、空间编辑删除、空间分析                
  空间成员模块	添加/移除成员、角色分配（viewer/editor/admin）、我加入的团队空间
  空间分析模块	容量/分类/标签/大小/用户行为/排行榜多维分析                
  文件模块  	腾讯云 COS 文件上传/下载测试接口                     
  协同编辑模块	WebSocket 实时编辑消息，基于 Disruptor 无锁队列处理    

---

三、技术栈

后端

- 框架：Spring Boot 2.6.13
- JDK：Java 8
- 持久层：MyBatis-Plus 3.5.9、MySQL 8
- 数据库中间件：ShardingSphere-JDBC 5.2.0（图片表按 spaceId 分表）
- 缓存：Redis + Caffeine 本地缓存
- 认证鉴权：Sa-Token 1.45.0 + Spring Session Redis
- 对象存储：腾讯云 COS
- AI 能力：阿里云图像生成/扩图 API
- 实时通信：Spring WebSocket + Disruptor 无锁队列
- 工具库：Hutool、Lombok、Knife4j、jsoup
- 构建工具：Maven

前端

- 框架：Vue 3 + TypeScript
- 构建工具：Vite
- UI 组件库：Element Plus
- 状态管理：Pinia
- 路由：Vue Router
- 图表：ECharts

---

四、项目结构

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
    │   └── create_table.sql               # 数据库初始化脚本
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
    └── pom.xml

---

五、数据库设计（核心表结构）

数据库名：zhe_picture

1. 用户表 user

  字段                                	类型           	说明             
  id                                	bigint       	主键             
  userAccount                       	varchar(256) 	账号，唯一          
  userPassword                      	varchar(512) 	加密密码           
  userName                          	varchar(256) 	昵称             
  userAvatar                        	varchar(1024)	头像 URL         
  userProfile                       	varchar(512) 	简介             
  userRole                          	varchar(256) 	角色：user / admin
  editTime / createTime / updateTime	datetime     	时间戳            
  isDelete                          	tinyint      	逻辑删除           

2. 图片表 picture

  字段                                      	类型          	说明                      
  id                                      	bigint      	主键                      
  url                                     	varchar(512)	原图 URL                  
  thumbnailUrl                            	varchar(512)	缩略图 URL                 
  name                                    	varchar(128)	图片名称                    
  introduction                            	varchar(512)	简介                      
  category                                	varchar(64) 	分类                      
  tags                                    	varchar(512)	标签 JSON 数组              
  picSize / picWidth / picHeight / picScale / picFormat	-           	图片元信息                   
  picColor                                	varchar(16) 	图片主色调                   
  userId                                  	bigint      	创建用户 ID                 
  spaceId                                 	bigint      	所属空间 ID，为空表示公共空间        
  reviewStatus                            	int         	审核状态：0-待审核 / 1-通过 / 2-拒绝
  reviewMessage / reviewerId / reviewTime 	-           	审核相关信息                  
  createTime / editTime / updateTime      	datetime    	时间戳                     
  isDelete                                	tinyint     	逻辑删除                    

图片表按 spaceId 使用 ShardingSphere 动态分表，空间级查询路由到对应分表。

3. 空间表 space

  字段                                	类型          	说明                      
  id                                	bigint      	主键                      
  spaceName                         	varchar(128)	空间名称                    
  spaceLevel                        	int         	等级：0-普通版 / 1-专业版 / 2-旗舰版
  spaceType                         	int         	类型：0-私有 / 1-团队          
  maxSize / maxCount                	bigint      	最大容量与数量                 
  totalSize / totalCount            	bigint      	当前已用容量与数量               
  userId                            	bigint      	创建者 ID                  
  createTime / editTime / updateTime	datetime    	时间戳                     
  isDelete                          	tinyint     	逻辑删除                    

4. 空间成员表 space_user

  字段                     	类型          	说明                          
  id                     	bigint      	主键                          
  spaceId                	bigint      	空间 ID                       
  userId                 	bigint      	用户 ID                       
  spaceRole              	varchar(128)	空间角色：viewer / editor / admin
  createTime / updateTime	datetime    	时间戳                         

完整 SQL 见：sql/create_table.sql

---

六、核心接口文档

项目集成 Knife4j（Swagger） 接口文档，启动后端后访问：

    http://localhost:8123/api/doc.html

主要接口前缀：

  模块       	前缀                  
  用户模块     	/api/user           
  图片模块     	/api/picture        
  空间模块     	/api/space          
  空间分析     	/api/space/analyze  
  空间成员     	/api/spaceUser      
  文件模块     	/api/file           
  WebSocket	/api/ws/picture/edit

部分关键接口示例

- POST /api/user/register：用户注册（当前需管理员角色）
- POST /api/user/login：用户登录
- GET /api/user/get/login：获取当前登录用户
- POST /api/picture/upload：图片文件上传
- POST /api/picture/upload/url：通过 URL 上传图片
- POST /api/picture/list/page/vo：分页查询图片（公开/空间）
- POST /api/picture/search/color：按颜色搜索图片
- POST /api/picture/out_painting/create_task：创建 AI 扩图任务
- POST /api/picture/review：管理员审核图片
- POST /api/space/add：创建空间
- POST /api/space/analyze/usage：空间使用情况分析
- POST /api/spaceUser/add：添加空间成员

---

七、快速启动

环境要求

- JDK 1.8+
- Maven 3.6+
- MySQL 8.0+
- Redis 5.0+
- Node.js 18+（前端）

配置步骤

1. 克隆项目

    git clone https://github.com/sdfkl/zhe-picture-backend.git
    cd zhe-picture-backend

2. 导入数据库

    mysql -u root -p < sql/create_table.sql

3. 修改配置文件

打开 src/main/resources/application.yml 与 application-local.yml，按需修改：

    # application.yml
    spring:
      datasource:
        url: jdbc:mysql://localhost:3306/zhe_picture
        username: root
        password: 你的密码
      redis:
        host: localhost
        port: 6379
        password: 你的密码
    
    # application-local.yml
    cos:
      client:
        secretId: 你的腾讯云 COS SecretId
        secretKey: 你的腾讯云 COS SecretKey
        region: ap-你的地域
        bucket: 你的 bucket
    
    aliyun:
      apiKey: 你的阿里云百炼 API Key

如需开启图片表分片，请确保数据库中已创建对应分表（如 picture_1、picture_2），或在 PictureShardingAlgorithm 中调整默认路由策略。

4. 启动后端

    mvn clean install -DskipTests
    mvn spring-boot:run

或直接运行 ZhePictureBackendApplication。

后端启动后，访问：

    http://localhost:8123/api/doc.html

5. 启动前端

    cd frontend
    npm install
    npm run dev

默认访问地址：http://localhost:5173

访问测试

1. 打开 http://localhost:5173 进入登录页。
2. 使用管理员账号登录（初始可通过数据库插入用户，密码为 MD5 加密后的结果；管理员添加用户的默认密码为 19880314）。
3. 测试图片上传、空间创建、成员邀请、颜色搜索、AI 扩图等功能。
4. 多开浏览器标签页进入同一张图片详情页，测试 WebSocket 协同编辑消息。

---

八、项目亮点

- 前后端分离：后端专注于接口与业务能力，前端基于 Vue 3 + Element Plus 提供流畅交互。
- 空间级数据隔离与分片：图片表按 spaceId 动态分表，兼顾公共空间查询与私有空间扩展。
- 多级缓存架构：Caffeine + Redis 两级缓存提升公开图库查询性能，并设置随机过期时间防止缓存雪崩。
- 细粒度权限控制：Sa-Token 统一登录态，空间内角色区分 viewer/editor/admin，关键操作通过注解鉴权。
- AI 能力接入：集成阿里云 AI 扩图，支持图片智能外绘。
- 实时协同编辑：WebSocket 结合 Disruptor 无锁队列处理编辑事件，支持多人协同场景。
- 空间多维分析：提供容量、分类、标签、大小、用户行为、排行榜等分析视图。
- 对象存储与缩略图：图片资源存储于腾讯云 COS，支持缩略图与主色调提取。

---

九、待优化项

- 注册接口当前限定管理员角色，后续支持公开注册 + 邮箱/短信验证码。
- 引入分布式锁（Redisson）防止空间额度、图片审核等并发场景下的数据不一致。
- 图片审核从人工审核升级为 AI 内容安全自动审核。
- 补齐单元测试与接口自动化测试覆盖。
- 引入 Elasticsearch 提升图片全文检索与标签聚合性能。
- 分表环境下完善动态建表与分表迁移工具。
- 前端补充图片懒加载、虚拟滚动、PWA 离线能力。

---

十、关于我

- GitHub 主页：https://github.com/ihyam30/zhe-picture-backend
- 为什么做这个项目：
  我希望通过一个完整的全栈项目，把 Java 后端开发中常用的技术栈——Spring Boot、MyBatis-Plus、Redis、权限认证、分库分表、WebSocket、对象存储、AI 接口接入等——串联起来，同时也练习 Vue 3 前端工程化开发。图片管理是一个贴近实际业务、需求清晰、扩展性强的场景，非常适合作为个人技术沉淀与面试展示项目。
