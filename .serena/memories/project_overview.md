# 玲珑应用商店社区版 (linglong-store)

## 项目简介
这是一个使用 **Rust (Tauri 2.x) + React 18 + TypeScript** 构建的玲珑应用商店社区版客户端。用于管理 Linux 系统上的玲珑应用包（安装、卸载、更新等）。

## 技术栈

### 前端
- **框架**: React 18.3 + TypeScript 5.6
- **构建工具**: Vite 6.0
- **UI 库**: Ant Design 5.x
- **状态管理**: Zustand 5.x + @tauri-store/zustand
- **路由**: react-router-dom 7.x
- **HTTP 客户端**: Alova 3.x
- **图标**: @ant-design/icons + @icon-park/react
- **样式**: Less 4.x + Sass (sass-embedded)

### 后端 (Tauri)
- **Tauri**: 2.x
- **插件**: fs, log, opener, os

## 项目结构
```
src/
├── apis/          # API 请求层 (alova)
│   ├── apps/      # 应用相关 API
│   ├── invoke/    # Tauri invoke 调用
│   └── request.ts # 请求配置
├── components/    # 公共组件
├── constants/     # 常量定义
├── hooks/         # 自定义 Hooks
├── layout/        # 布局组件
├── pages/         # 页面组件
├── router/        # 路由配置
├── services/      # 业务服务层
├── stores/        # Zustand 状态管理
├── styles/        # 全局样式
├── types/         # TypeScript 类型定义
└── util/          # 工具函数

src-tauri/         # Rust 后端代码
```

## 环境要求
- Node.js
- pnpm (包管理器)
- Rust (用于 Tauri)
- Linux 系统 (玲珑包管理器环境)