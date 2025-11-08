# 玲珑商店 - AI 助手指令

## 项目概述
基于 **Tauri 2.0** 构建的 Linux 桌面应用，用于管理玲珑（Linglong）应用程序。

**技术栈**：
- **前端**：React 18.3.1 + TypeScript + Vite
- **后端**：Rust + Tauri 2.0
- **UI 组件库**：Ant Design 5.27.6
- **状态管理**：Zustand 5.0.8（配合 @tauri-store/zustand 实现持久化）
- **HTTP 客户端**：Alova 3.3.4
- **路由**：React Router 7.7.0

**核心原则**：Tauri 命令通过 `ll-cli`（玲珑命令行工具）处理所有系统交互，前端通过后端 API 获取应用元数据。

## 架构设计

### 双后端模式
1. **Rust/Tauri 后端**（`src-tauri/`）：通过 `ll-cli` 命令执行系统操作
   - 服务模块：`src-tauri/src/services/` 下的各模块
     - `installed.rs`：已安装应用管理
     - `process.rs`：进程管理
     - `network.rs`：网络相关
     - `mod.rs`：模块导出
   - 通过 `src/apis/invoke/` 中的 `invoke()` 暴露命令
   - 示例：`ll-cli list --json` → 解析 → 返回 `InstalledApp[]`

2. **HTTP API 后端**：应用元数据（图标、中文名称、描述等）
   - 基础 URL 在 `env/.env.{dev|test}` 中配置为 `VITE_SERVER_URL`
   - 默认地址：`https://storeapi.linyaps.org.cn/`
   - 请求封装：`src/apis/request.ts`，使用 Alova 库
   - API 模块结构：
     - `src/apis/apps/`：应用相关 API
     - `src/apis/template/`：模板/分类 API
     - `src/apis/invoke/`：Tauri 命令封装

### 状态管理（Zustand）
- **`stores/global.ts`**：全局状态
  - 应用初始化状态
  - 系统架构信息
  - 更新计数等
- **`stores/installedApps.ts`**：已安装应用列表
  - 应用列表数据
  - 加载状态管理
- **`stores/appConfig.ts`**：应用配置（持久化）
  - 通过 `@tauri-store/zustand` 实现自动持久化到磁盘
  - 配置项示例：
    - `checkVersion`：版本检查开关
    - `showBaseService`：显示基础服务标志
  - 使用 `createTauriStore()` 创建持久化 store

### 前端架构
- **路由**：React Router v7
  - 配置位置：`src/router/index.tsx`
  - 使用懒加载优化页面性能
- **布局**：`src/layout/`
  - `LaunchPage`：启动页面（3秒初始化动画）
  - `Titlebar`：顶部标题栏
  - `Sidebar`：侧边导航栏
  - `Outlet`：页面内容区域
- **组件规范**：
  - 类型定义：同目录的 `types.ts` 文件
  - 样式文件：`*.module.scss`（CSS Modules）
  - 组件入口：`index.tsx`
  - 参考示例：`src/components/ApplicationCard/`
- **类型安全**：
  - 使用 `import type { }` 导入类型
  - 详见 `src/types/` 目录结构

## 关键工作流

### 开发命令（基于 pnpm）
```bash
# 开发环境（使用 env/.env.dev）
pnpm dev              # 或 pnpm dev:test / pnpm dev:pro

# 生产构建
pnpm build:pro        # 编译 Rust + 打包前端

# 代码检查
pnpm lint:fix         # 自动修复 ESLint 问题
```

### 添加 Tauri 命令
1. 在 `src-tauri/src/services/{module}.rs` 中实现：
   ```rust
   pub async fn my_function() -> Result<Vec<MyType>, String> {
       let output = Command::new("ll-cli")
           .args(["my-command", "--json"])
           .output()
           .map_err(|e| format!("Error: {}", e))?;
       // 解析并过滤（例如：kind == "app" 过滤应用）
   }
   ```

2. 在 `src-tauri/src/lib.rs` 中导出：
   ```rust
   use services;
   
   #[tauri::command]
   async fn my_command() -> Result<Vec<MyType>, String> {
       services::module::my_function().await
   }
   // 添加到 invoke_handler![..., my_command]
   ```

3. 在 `src/apis/invoke/index.ts` 中创建前端绑定：
   ```typescript
   export const myCommand = async(): Promise<MyType[]> => {
     return await invoke('my_command')
   }
   ```

### 环境特定构建
- 编辑 `env/.env.{dev|test}` 配置 API 端点
- NODE_ENV 由 package.json 脚本中的 `cross-env` 设置
- 通过 `import.meta.env.VITE_SERVER_URL` 访问
- 环境变量必须以 `VITE_` 开头才能在前端访问

## 项目特定约定

### 过滤逻辑（参见 FILTER_APPS_BY_KIND.md）
**始终在 Rust 层面过滤**以提升性能：
```rust
apps.into_iter()
    .filter(|item| item.kind.as_ref().map_or(false, |k| k == "app"))
    .collect()
```
函数 `get_installed_apps()` 与 `get_all_installed_apps()` 的区别在于是否过滤。

### 类型组织
- **全局类型**：
  - `src/types/common.d.ts`：通用类型定义
  - `src/types/api/common.d.ts`：API 响应基础类型
    - `BaseResponse<T>`：标准响应结构
    - `IPageData<T>`：分页数据结构
- **API 特定类型**：
  - `src/types/api/apps.d.ts`：应用相关类型
  - 或者 `src/apis/{module}/types.ts`：模块内部类型
- **组件特定类型**：同目录的 `types.ts`
  - 示例：`src/components/ApplicationCard/types.ts`
- **最佳实践**：
  - 始终使用 `import type { }` 语法导入类型
  - 使用命名空间（namespace）组织相关类型

### 组件结构
```
ComponentName/
├── index.tsx           # 主组件
├── index.module.scss   # CSS Modules 作用域样式
└── types.ts           # 组件特定类型（Props、枚举等）
```
**类型定义示例**（`ApplicationCard/types.ts`）：
```typescript
export enum OperateType {
  UNINSTALL = 0,
  INSTALL = 1,
  UPDATE = 2,
  OPEN = 3,
}

export interface ApplicationCardProps {
  // 组件属性...
}
```

### 样式
- **UI 组件库**：Ant Design 5.27.6
  - 使用 `<Button>`、`<Typography>` 等组件
  - 图标库：`@ant-design/icons` 和 `@icon-park/react`
- **样式方案**：SCSS + CSS Modules
  - 组件样式：`*.module.scss` 文件
  - 通过 `import styles from './index.module.scss'` 导入
  - 使用 `styles.className` 访问类名
- **主题**：`src/styles/Theme.ts` 在 `App.scss` 中加载

## 集成点

### 玲珑 CLI（`ll-cli`）
所有系统操作通过命令与玲珑交互：
- `ll-cli list --json [--type=all]` → 获取已安装应用
- `ll-cli ps` → 运行中的进程  
- `ll-cli kill <app>` → 停止应用
- `ll-cli run <appid> --version=<ver>` → 启动应用

**在 Rust 中解析输出**并返回结构化数据到前端。

### 多环境 API
后端 API 根据环境（dev/test）不同：
- 获取应用详情（图标 URL、本地化名称）
- 通过 `request.ts` 中的 `paginate()` 辅助函数支持分页
- 模板/分类数据用于 UI

## 已知模式

### 启动序列
1. `main.tsx`：初始化 `tauriAppConfigHandler.start()`（加载持久化配置）
2. `Layout`：显示 `LaunchPage` 3秒，同时：
   - 通过 `@tauri-apps/plugin-os` 的 `arch()` 获取系统架构
   - 模拟更新检查（`getUpdateAppNum()`）
3. 渲染主 UI 及侧边栏导航

### 迁移说明（MIGRATION_INSTALLED_APPS.md）
v2.0.0 从 Electron 迁移到 Tauri。主要变更：
- 用 Tauri invoke 命令替换 IPC
- 将 `ll-cli` 执行从 Node.js 迁移到 Rust
- Zustand stores 替换 Redux

## 关键参考文件
- **类型系统**：`src/types/common.d.ts`、`src/types/api/common.d.ts`
- **API 模式**：`src/apis/request.ts`、`src/apis/apps/index.ts`
- **Tauri 命令**：`src-tauri/src/lib.rs`、`src-tauri/src/services/`
- **状态示例**：`src/stores/appConfig.ts`（持久化）、`src/stores/global.ts`（临时）
- **组件模板**：`src/components/ApplicationCard/`

## 测试与调试
- 目前未配置测试套件
- 手动运行 `ll-cli` 命令验证行为
- 使用 `pnpm dev` 进行前端热重载开发
- Rust 更改需要重启（`pnpm dev` 虽然会监听，但 Tauri 需要完全重启）
