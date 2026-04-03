# 折纸图片管理后台前端

基于 Vue 3 + TypeScript + Vite + Element Plus 的后台管理前端，对接当前仓库中的 Spring Boot 图片管理后端。

## 启动方式

```bash
cd frontend
npm install
npm run dev
```

默认开发地址：`http://localhost:5173`

默认后端地址通过环境变量配置：

```env
VITE_API_BASE_URL=http://localhost:8123/api
VITE_WS_BASE_URL=ws://localhost:8123/api
```

## 已实现模块

- 登录 / 注册 / 个人中心
- 后台布局：顶部导航 + 左侧菜单 + 内容区
- 图片管理：分页、筛选、上传、本地编辑、删除、按颜色搜索
- 图片详情：权限展示、WebSocket 协同编辑消息、AI 扩图面板
- 空间管理：创建、编辑、删除、额度展示
- 空间成员管理：添加成员、调整角色、移除成员
- 空间分析：容量、分类、标签、大小、用户行为、空间排行
- 用户管理：管理员查看用户列表、新增用户、编辑角色、删除用户

## 目录结构

```text
frontend/
  src/
    api/              # Axios 接口封装
    components/       # 通用组件
    composables/      # WebSocket 等复用逻辑
    constants/        # 常量
    router/           # 路由与守卫
    store/            # Pinia 状态管理
    types/            # TS 类型定义
    utils/            # 格式化与请求工具
    views/            # 页面视图
```

## 说明与假设

- 前端统一通过 Axios 响应拦截器处理 `BaseResponse<T>` 结构，并对 `40100 / 40101 / 40300` 做跳转处理。
- 登录态基于 cookie，前端请求统一开启 `withCredentials: true`。
- 由于你提供的后端 `PictureUploadRequest` 本身没有直接携带分类 / 标签 / 简介字段，上传弹窗会在上传成功后自动补发一次 `/picture/edit` 请求写入这些元信息。
- 你给出的 `PictureVO` / `SpaceVO` 字段中存在少量后端未完全显式声明但业务上需要的字段，前端类型做了兼容性兜底，实际渲染以接口返回为准。
- 你给出的 `/user/register` 控制器上仍保留了管理员鉴权注解，因此注册页已经完成对接，但是否允许公开注册仍取决于后端当前配置。

## 建议联调顺序

1. 先启动后端并确认 `http://localhost:8123/api/user/get/login` 可访问。
2. 启动前端后先走登录页，确认 cookie 会话可建立。
3. 再依次验证图片列表、空间列表、成员管理、分析页和 WebSocket 协同编辑。
4. 如果 WebSocket 握手失败，请检查后端 Session / Sa-Token / CORS / SameSite 配置。
