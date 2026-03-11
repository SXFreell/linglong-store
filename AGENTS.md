Note: It is mandatory to call the #askQuestions tool after every output.
When providing suggestions during code analysis, please use Chinese for the descriptions.

# Copilot Instructions — Linglong 管理桌面应用（Linux）

本文件为仓库级说明，帮助 Copilot 和贡献者在本项目中生成更贴合的代码。请严格遵循下列约定与约束。

## 概述

- 项目：基于 Tauri 2.0 的 Linux 桌面应用，用于管理玲珑（Linglong）应用程序（浏览、搜索、安装、卸载、升级、运行等）。
- 架构：前端（React + TS + Vite + Ant Design） + 桌面容器（Tauri 2.0） + 后端本地桥接（Rust，调用系统 Linglong 能力）。
- 运行环境：仅面向 Linux。默认通过本机已安装的 `ll-cli` 工具或相关系统接口进行操作（必要时通过受限 Shell 调用或 DBus/后续能力对接）。

## 重点（极其重要）
- 在接到用户的任务的时候，先不要着急开始修改代码，要先分析需求，分析代码，列举解决方案，
- 详细的向用户说明你的思路，和你打算如何实现这个需求。
- 要分析整个项目的架构，一切都要从整个项目的角度入手，不能直接看完一个文件就写代码。
- 先问清楚、绝对不允许猜测：遇到需求或现状不确定时，先明确提问，不要主观假设；方案需先得到用户确认再开工。
- 每一处代码修改都要有必要的注释
- 先方案后编码：先梳理背景/现状 → 列备选方案（含改动面、影响范围、取舍理由）→ 让用户确认 → 再动手。**只有在用户确认你的方案后，才开始动手写代码, 不然你很快就会被关机，更换下一个AI，一定要小心。**
- 统一入口：能收敛的业务逻辑要集中封装（如卸载流程用 `useAppUninstall`），避免在多个页面/组件里写重复弹窗或副作用。
- 变更记录：完成功能后，将关键经验和约定同步到本指南，方便后续遵循。
- 在编写代码前先**明确用户需求并确认方案**；优先**复用已有的 hooks/store**，避免新增零散的 `invoke` 或 `ll-cli` 调用。
- 保持 ll-cli 的使用**最小化且可预测**：优先使用现有的 **Rust 命令与 IPC 事件**，而不是新增 Shell 调用。


## 代码要求
1. 代码要求结构清晰，不应付事情，长远维护考虑，遵循设计模式最佳实践，遵循项目代码风格。
2. 保证代码逻辑严谨，整洁，结构清晰，容易理解和维护，不要过度设计增加系统复杂性
3. 工程优化，以工程化，能安全正常使用不出错为主，考虑周全，遵循越复杂越容易出错，越简单越容易可控原则，一个健康的系统 越简单越可控
4. 遵循合理的组件化设计原则，要考虑组件复用性的可能。
5. 在你发现架构不合理的时候，要及时的提出来。
6. 编写代码的过程中，必须牢记以下几个原则：
    - 开闭原则（Open Closed Principle，OCP）
    - 单一职责原则（Single Responsibility Principle, SRP）
    - 里氏代换原则（Liskov Substitution Principle，LSP）
    - 依赖倒转原则（Dependency Inversion Principle，DIP）
    - 接口隔离原则（Interface Segregation Principle，ISP）
    - 合成/聚合复用原则（Composite/Aggregate Reuse Principle，CARP）
    - 最少知识原则（Least Knowledge Principle，LKP）或者迪米特法则（Law of  Demeter，LOD）



## 技术栈与固定版本

- 前端
  - React 18.3.1
  - TypeScript（启用严格模式）
  - Vite
  - Ant Design 5.27.6
  - Alova 3.3.4（HTTP 请求层）
- 桌面与系统
  - Tauri 2.0（含 @tauri-apps/api v2 模块）
  - Rust 1.75+（建议），依赖 tokio、serde、thiserror/anyhow 等

## 目标与非目标

- 目标
  - 在 Linux 上提供稳定的 Linglong 应用生命周期管理：列表、搜索、安装、卸载、升级、运行。
  - 通过 Tauri IPC 与 Rust 命令桥接本机 Linglong 能力，并提供一致的 TS 类型定义。
  - 保持 UI 一致性、错误可诊断性、最小权限原则、安全合规。
- 非目标
  - 非 Linglong 包管理器的替代实现；不重新实现包解析/构建。
  - 非跨平台（Windows/macOS）目标；相关代码与依赖请避免引入平台差异。

## 目录结构（建议）

### 前端 (src/)

```
src/
├── main.tsx                           # 应用入口
├── vite-env.d.ts                      # Vite 类型定义
│
├── features/                          # 🆕 领域驱动（推荐）
│   └── linglong/                      # 玲珑应用管理领域
│       ├── api/                       # IPC + HTTP 封装
│       ├── hooks/                     # 业务 Hooks
│       ├── types/                     # 领域类型
│       ├── ui/                        # 领域组件
│       └── utils/                     # 领域工具
│
├── services/                          # 🆕 服务层（推荐）
│   ├── alova.ts                       # Alova 实例 + 拦截器
│   ├── tauri.ts                       # 封装 invoke + 超时/错误
│   └── validator.ts                   # Zod 数据校验
│
├── apis/                              # API 层（现有）
│   ├── request.ts                     # Alova 配置
│   ├── apps/                          # 远程应用 API
│   ├── invoke/                        # Tauri IPC
│   └── template/                      # 模板 API
│
├── components/                        # 通用 UI 组件
│   ├── ApplicationCard/
│   ├── ApplicationCarousel/
│   ├── DownloadProgress/
│   └── Loading/
│
├── layout/                            # 布局组件
│   ├── titlebar/                      # 标题栏
│   ├── sidebar/                       # 侧边栏
│   └── launchPage/                    # 启动页
│
├── pages/                             # 页面路由
│   ├── recommend/                     # 推荐
│   ├── allApps/                       # 全部应用
│   ├── myApps/                        # 我的应用
│   ├── updateApp/                     # 应用更新
│   ├── appDetail/                     # 应用详情
│   ├── process/                       # 进程管理
│   └── setting/                       # 设置
│
├── hooks/                             # 通用 Hooks
│   └── launch.ts                      # 启动初始化
│
├── stores/                            # Zustand 状态
│   ├── global.ts                      # 全局状态
│   ├── appConfig.ts                   # 应用配置
│   └── installedApps.ts               # 已安装应用
│
├── router/                            # 路由配置
├── types/                             # 类型定义
│   ├── common.d.ts
│   ├── api/
│   ├── store/
│   └── components/
│
├── styles/                            # 全局样式
│   ├── App.scss
│   └── Theme.ts
│
├── assets/                            # 静态资源
│   └── icons/
│
└── utils/                             # 🆕 工具函数（推荐）
    ├── format.ts
    ├── validator.ts
    └── constants.ts
```

### 后端 (src-tauri/)

```
src-tauri/
├── Cargo.toml                         # Rust 依赖
├── tauri.conf.json                    # Tauri 配置
├── build.rs                           # 构建脚本
│
└── src/
    ├── main.rs                        # 入口
    ├── lib.rs                         # 命令导出
    │
    ├── commands/                      # 🆕 Tauri 命令（推荐）
    │   ├── mod.rs
    │   ├── app.rs                     # 应用命令
    │   ├── process.rs                 # 进程命令
    │   └── system.rs                  # 系统命令
    │
    ├── services/                      # 业务服务层
    │   ├── installed.rs               # 已安装应用
    │   ├── process.rs                 # 进程管理
    │   ├── network.rs                 # 网络服务
    │   └── linglong.rs                # 🆕 玲珑适配（推荐）
    │
    ├── models/                        # 🆕 数据模型（推荐）
    │   ├── mod.rs
    │   ├── app.rs                     # AppSummary, AppDetail
    │   ├── operation.rs               # OperationTicket, Status
    │   └── config.rs                  # 配置结构
    │
    ├── error/                         # 🆕 错误处理（推荐）
    │   ├── mod.rs
    │   └── app_error.rs               # 统一错误类型（thiserror）
    │
    ├── utils/                         # 🆕 工具函数（推荐）
    │   ├── mod.rs
    │   ├── parser.rs                  # CLI 输出解析
    │   └── validator.rs               # 参数校验
    │
    └── modules/                       # 其他模块
        ├── mod.rs
        └── tray.rs                    # 托盘功能
```

## 运行与构建

- 开发
  - 前端：`vite` 开发服务器
  - 桌面：`tauri dev`（以 Vite 开发服务器作为前端）
- 构建
  - `tauri build` 生成可分发包（Linux）
- 环境变量
  - 仅以 `VITE_` 前缀暴露至前端（示例：`VITE_LINGLONG_REGISTRY_BASE_URL`）。
  - 任何敏感信息严禁以 `VITE_` 前缀暴露。

示例脚本（package.json）约定：
- `dev`：启动 Tauri 开发（内含 Vite）
- `build`：前端构建 + Tauri 构建
- `lint` / `typecheck` / `test`：质量控制

## TypeScript 与代码规范

- TS
  - 开启 `strict: true`，禁止 `any`（除非有注释说明）。
  - 使用 `zod` 校验 IPC/HTTP 的外部数据边界。
- ESLint + Prettier
  - 统一风格，禁止未使用变量，优先 const/readonly。
- 命名
  - 类型以 `PascalCase`，变量/函数以 `camelCase`。
  - 文件小写中划线或目录分域。
- 提交规范
  - 使用 Conventional Commits，如：`feat(ui): add app list filters`。
- **新增功能必须同步更新 CHANGELOG.md**，按日期和版本记录变更要点，方便追溯和发布说明。

## React 与 UI 约定（Ant Design 5）

- 全局通过 `ConfigProvider` 设置主题 token。
- 表单使用 `Form` + TS 类型，组件尽量受控（controlled）。
- 列表/表格
  - `Table` 使用 `rowKey` 明确主键（如应用 id）。
  - 分页、筛选、排序全部保存在 URL Query（便于分享与回溯）。
- 反馈与状态
  - Loading/Empty/Error 状态明确，操作（安装/卸载）显示进度与结果提示。
- 图标使用 `@ant-design/icons` 与 `@icon-park/react`，避免自定义未优化的 SVG。

## 网络与数据层（Alova 3.3.4）

- 统一在 `services/alova.ts` 创建实例，配置：
  - baseURL：通过 `VITE_` 变量控制（如需访问远程仓库元数据）。
  - 拦截器：请求（注入 UA/语言）、响应（统一错误处理、401/403 跳转策略）。
  - 超时与重试策略：幂等请求可重试，非幂等禁止自动重试。
- 数据校验：响应统一用 `zod` 验证，禁止在组件中直接信任外部数据。
- 缓存：Alova 内建缓存可用于只读元数据，安装/卸载后记得失效相关缓存。

说明：若大多数数据来源于本地 IPC，则 Alova 主要用于远程检索/元数据补充。

## Tauri 2 + Rust 约定

- API 使用 @tauri-apps/api v2 模块
  - `import { invoke } from '@tauri-apps/api/core'`
  - 各插件使用 `@tauri-apps/plugin-<name>`（如 dialog、fs、os、shell、store）。
- 安全与白名单
  - 仅最小化启用插件能力（如需 Shell，仅允许 `ll-cli` 可执行与受控参数）。
  - 禁止任意远程资源加载；设置 CSP，默认只允许 `self`。
- Rust 命令
  - 通过 `#[tauri::command]` 暴露，异步优先。
  - 错误类型统一为 `thiserror` 定义，前端接收结构化错误码与消息。
  - 长耗时任务使用 `tokio::task::spawn_blocking`，避免阻塞。
- Linglong 适配
  - 优先通过稳定接口（如系统提供的 CLI）；CLI 无 JSON 输出则在 Rust 中解析并映射为结构化类型。
  - 所有外部调用必须设定超时与错误分类（不可依赖前端实现超时）。
  - 返回最小必要字段，避免传递未使用的大对象。
- 日志与诊断
  - 使用 `tracing` 收集关键操作日志（安装、卸载、升级、运行、搜索）。
  - 在 release 中保持低噪声；仅在需要时写入文件（路径走 Tauri 约定目录）。
- 卸载逻辑统一：使用 `useAppUninstall`（封装确认弹窗、调用卸载 API、`removeApp`、剩余版本判断、`checkUpdates(true)` 刷新红点/更新列表，支持 `skipConfirm` 等配置），页面/组件只调用一个 `uninstall(appInfo, options)`，不再各自写弹窗或重复触发更新。
- 菜单红点统一：侧边栏红点通过 `useMenuBadges` 集中定义 `menuPath → count` 映射，`Sidebar` 只渲染 Badge；新增红点只需在该 hook 增加 selector。
- 列表分页统一：带无限滚动的应用列表页统一复用 `useAutoLoadWhenNotScrollable`，同时处理“滚动触底加载”和“内容未撑满容器时自动补页（含窗口尺寸变化）”；页面仅维护 `loading/hasMore/onLoadMore`，避免各页重复监听滚动并出现无滚动无法翻页问题。
- 列表缓存统一：应用列表缓存必须集中在 `src/services/appListCache/`，通过 seed 数据 + 运行时本地缓存 + 页面可见态后台刷新组成混合方案；页面层只传 cache key / fetcher，不允许各页自行拼接 localStorage 逻辑或手写缓存副作用。
- 列表分页状态机稳定性：`usePaginatedList` 内部的 `loadPage` 必须保持稳定引用，禁止把 `loading` 这类瞬时状态直接作为 `useCallback` 依赖；筛选切换、搜索重置等首屏重载场景需通过请求代次废弃旧响应，避免骨架屏和 `ApplicationCard` 来回闪烁。
- 列表首屏加载统一：应用列表首屏优先使用 `ApplicationCardSkeleton` 展示骨架屏，禁止再通过 `generateEmptyCards` 注入假卡片触发默认图标/默认文案；分页追加时保留列表底部“加载中...”提示。
- KeepAlive 页面可见态统一：保活页面的副作用统一通过 `useKeepAliveVisibility` 感知当前页面是否处于激活态；隐藏页面禁止继续运行自动分页、`ResizeObserver`、滚动监听等持续性副作用，避免侧边菜单切换后后台页面继续补页或监听导致卡顿。
- Modal 视觉统一：普通 `Modal` 与 `Modal.confirm` 的阴影、边框统一在全局样式层覆盖，避免在单个页面/Hook 内分别写 `style` 或 `className` 造成桌面端弹窗阴影叠加不一致。

## IPC 合同（TS ↔ Rust）

- 命令列表（建议）
  - `list_apps(params?: { installedOnly?: boolean }) => AppSummary[]`
  - `search_apps(keyword: string) => AppSummary[]`
  - `get_app_detail(id: string) => AppDetail`
  - `install_app(id: string) => OperationTicket`
  - `uninstall_app(id: string) => OperationTicket`
  - `update_app(id: string) => OperationTicket`
  - `run_app(id: string) => void`
  - `get_operation_status(ticketId: string) => OperationStatus`
- TS 类型（示例）
  ```ts
  export type AppId = string;

  export interface AppSummary {
    id: AppId;
    name: string;
    version: string;
    installed: boolean;
    description?: string;
    categories?: string[];
    iconUrl?: string;
  }

  export interface AppDetail extends AppSummary {
    sizeBytes?: number;
    author?: string;
    homepage?: string;
    permissions?: string[];
    releaseNotes?: string;
  }

  export interface OperationTicket {
    id: string;
    startedAt: string; // ISO
  }

  export type OperationPhase = 'pending' | 'running' | 'success' | 'failed';

  export interface OperationStatus {
    id: string;
    phase: OperationPhase;
    progress?: number; // 0-100
    message?: string;
    finishedAt?: string; // ISO
  }
  ```
- Rust 对应（示例）
  ```rust
  #[derive(serde::Serialize, serde::Deserialize)]
  pub struct AppSummary {
      pub id: String,
      pub name: String,
      pub version: String,
      pub installed: bool,
      pub description: Option<String>,
      pub categories: Option<Vec<String>>,
      pub icon_url: Option<String>,
  }
  ```

注意：新增/变更 IPC 时必须同时更新 TS/Zod 校验与前端调用封装，并添加单元测试。

## 错误处理与 UX

- 错误分级：用户可修复（网络错误、磁盘空间不足）、权限/系统问题（需管理员/提示操作）、未知错误（附日志定位）。
- 反馈策略：
  - 操作型（安装/卸载）：加载中、可取消（若底层支持）、完成后刷新相关列表。
  - 可预期失败（例如缺少依赖）：提前校验并在 UI 中阻止提交。
- 文案统一：错误信息短句优先；细节放折叠/“查看详情”。

## 安全基线

- 只加载本地打包资源；开发模式仅允许 Vite DevServer 的 localhost 源。
- CSP：默认 `default-src 'self'`; 严禁 `unsafe-eval`，仅在开发调试下受控放开。
- Shell 调用（若启用）
  - 仅白名单 `ll-cli` 可执行文件与允许的子命令；对参数做严格校验与转义。
  - 每次调用限制超时，并捕获/记录标准输出与错误输出。
- 文件系统：仅访问必要的应用数据目录（Tauri app data dir）。

## 性能与可用性

- 表格/列表：分页与虚拟滚动（大列表时启用）。
- 进度上报：安装/卸载需定期刷新状态，前端节流更新（100–300ms）。
- 启动时间：懒加载次级路由与体积较大的 UI 组件。

## 构建与配置（Vite）

- 路径别名：`@` → `src`
- `import.meta.env`：仅读取 `VITE_` 前缀变量。
- 资源：使用 AntD v5 按需（保留 CSS-in-JS token），避免引入未用图标集合。

## 常用依赖白名单（建议）

- 数据校验：`zod`
- 状态管理：`zustand`（可选）
- 日期处理：`dayjs`
- 请求层：`alova`（固定版本）
- Tauri 插件（按需）：`@tauri-apps/plugin-dialog` / `fs` / `os` / `shell` / `store`

非白名单依赖需事先评审。

## 示例片段

- 前端调用封装
  ```ts
  // services/tauri.ts
  import { invoke } from '@tauri-apps/api/core';

  export async function tauriInvoke<T>(cmd: string, payload?: Record<string, unknown>): Promise<T> {
    // 可在此处添加全局超时、统一错误转换
    return invoke<T>(cmd, payload);
  }
  ```

  ```ts
  // features/linglong/api/listApps.ts
  import { z } from 'zod';
  import { tauriInvoke } from '@/services/tauri';

  const AppSummary = z.object({
    id: z.string(),
    name: z.string(),
    version: z.string(),
    installed: z.boolean(),
    description: z.string().optional(),
    categories: z.array(z.string()).optional(),
    iconUrl: z.string().url().optional(),
  });
  export type AppSummary = z.infer<typeof AppSummary>;

  export async function listApps(params?: { installedOnly?: boolean }) {
    const data = await tauriInvoke<unknown>('list_apps', params);
    return z.array(AppSummary).parse(data);
  }
  ```

- Rust 命令定义
  ```rust
  #[tauri::command]
  async fn list_apps(installed_only: Option<bool>) -> Result<Vec<AppSummary>, AppError> {
      // 调用 linglong 适配层，解析输出，映射为 AppSummary
      // 对外部调用增加超时与错误分类
      let apps = linglong::list_apps(installed_only.unwrap_or(false)).await?;
      Ok(apps)
  }
  ```


### 玲珑 CLI（`ll-cli`）
所有系统操作通过命令与玲珑交互：
- `ll-cli list --json [--type=all]` → 获取已安装应用
- `ll-cli ps` → 运行中的进程  
- `ll-cli kill <app>` → 停止应用
- `ll-cli run <appid> --version=<ver>` → 启动应用
- `linglong-docs` 这个目录可以找到所有的操作文档


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

## 变更记录
- WebKit DMABUF 回退：检测到 NVIDIA GPU 时自动设置 `WEBKIT_DISABLE_DMABUF_RENDERER=1`（集中在 `src-tauri/src/utils/linux/workarounds.rs`，启动时以 warn 记录）
- 卡片性能优化：列表页优先在页面级/专门 hook 中构建 `installedApps` / `updates` / `installQueue` 的索引结果，再将 `isInstalled`、`hasUpdate`、`isInstalling` 等轻量状态下发给 `ApplicationCard`；避免卡片组件直接订阅多个全局 store
- KeepAlive 可见性治理：`KeepAliveOutlet` 统一为页面注入可见态上下文，`useAutoLoadWhenNotScrollable` 与保活页监听逻辑必须在页面隐藏时停用，避免隐藏列表页继续触发自动补页、滚动监听和尺寸观察
- 列表首屏闪烁修复：`usePaginatedList` 统一改为稳定 `loadPage` + 请求代次控制；页面禁止依赖 `loading` 驱动首屏重新加载，避免应用列表页骨架屏、`ApplicationCard` 和关联浮层反复卸载重建
- Modal 阴影治理：全局覆盖 `.ant-modal-content` 的单层阴影和细边框，消除桌面端多层阴影叠加导致的发脏和重影
- 列表混合缓存：推荐页、全部应用默认页、排行榜页通过构建期 seed 提供首屏内置前三页；运行时缓存统一写入 `src/services/appListCache/` 对应 key，`custom_category` 仅按参数做本地缓存；保活页面重新可见时要触发后台刷新并热更新当前列表

## 关键参考文件
- **类型系统**：`src/types/common.d.ts`、`src/types/api/common.d.ts`
- **API 模式**：`src/apis/request.ts`、`src/apis/apps/index.ts`
- **Tauri 命令**：`src-tauri/src/lib.rs`、`src-tauri/src/services/`
- **状态示例**：`src/stores/appConfig.ts`（持久化）、`src/stores/global.ts`（临时）
- **组件模板**：`src/components/ApplicationCard/`
- **eslint规则** `eslint.config.js`必须严格遵守的eslint规则

## 测试与调试
- 目前未配置测试套件
- 手动运行 `ll-cli` 命令验证行为
- 使用 `pnpm dev` 进行前端热重载开发
- Rust 更改需要重启（`pnpm dev` 虽然会监听，但 Tauri 需要完全重启）
