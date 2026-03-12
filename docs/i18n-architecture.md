# i18n 设计方案

## 背景

当前项目的用户可见文案分散在页面、组件、hooks、`message` / `Modal.confirm` 提示以及静态配置对象中。  
如果继续沿用硬编码方式，后续会出现以下长期维护问题：

- 文案修改需要跨多个文件查找，容易漏改
- hooks 内的提示文案无法和页面语言切换保持一致
- Ant Design 组件语言、业务文案语言、远端应用元数据语言之间缺少统一边界
- 列表缓存、应用名称回退、远端 `lang/lan` 参数难以扩展成稳定方案

本次改造的目标不是一次性把全仓库所有页面都翻完，而是先建立一套可持续迁移的 i18n 基础设施，并将高频入口迁移到统一范式。

## 目标

- 支持 `跟随系统 / 简体中文 / English`
- 语言偏好进入已有 `ConfigStore`，随应用重启持久化
- 根层统一接入 Ant Design locale 与项目翻译能力
- 组件、页面、hooks、静态菜单配置统一使用翻译 key
- 为后续“远端应用元数据多语言”保留独立扩展位

## 非目标

- 本次不要求一次性改完全仓库全部文案
- 本次不改 Rust 侧 `ll-cli` 解析语言策略
- 本次不把远端应用名称、描述、截图语言和界面文案混成一套资源文件

## 分层原则

### 1. 界面文案层

界面文案统一放在 `src/i18n/resources/`。  
页面、组件、hooks 只能消费 key，不再直接新增硬编码中文。

适用范围：

- 页面标题
- 按钮文本
- `message` / `Modal.confirm` 提示
- 空状态、占位符、tooltip
- 侧边栏菜单、启动页说明、设置页说明

### 2. 应用元数据层

应用名称、描述、截图、分类等远端返回的数据不写进静态翻译字典。  
这类数据后续单独通过“按 locale 选择展示字段”的适配层处理。

当前统一入口：

- `src/utils/appDisplay.ts`

这里负责：

- 应用展示名称回退
- 描述字段兜底
- 后续接入远端多语言字段时的扩展

## 目录设计

```text
src/
├── i18n/
│   ├── core.ts                 # 语言解析、翻译查找、插值
│   ├── index.ts                # 对外导出 hooks / helpers
│   ├── antd.ts                 # Ant Design locale 映射
│   ├── types.ts                # TranslationKey / SupportedLocale 类型
│   └── resources/
│       ├── zh-CN.ts
│       └── en-US.ts
├── providers/
│   └── AppProviders.tsx        # 根级语言与 AntD provider
└── utils/
    └── appDisplay.ts           # 应用元数据展示适配
```

## 语言来源与优先级

1. `ConfigStore.languagePreference`
2. 若为 `system`，解析 `navigator.language`
3. 未命中时回退到 `zh-CN`

这样设计的原因：

- 桌面端用户普遍期望“跟随系统”
- 同时保留固定语言，方便测试和截屏
- 不依赖服务端返回语言，前端可稳定决策

## Key 命名规范

统一采用语义化分域命名：

- `common.*`
- `layout.*`
- `setting.*`
- `components.*`
- `hooks.*`
- `network.*`

示例：

- `layout.titlebar.searchPlaceholder`
- `components.downloadProgress.cancelFailed`
- `hooks.appUninstall.confirmUninstallContent`

约束：

- key 表达“语义”，不要把页面路径、组件文件名硬编码进 key
- 通用动作优先落在 `common.actions.*`
- 业务域文案放在对应域下，避免所有 key 都堆到 `common`

## 迁移策略

### 第一阶段

先迁移高频公共入口：

- 布局
- 启动页
- 环境检测弹窗
- 设置页
- 下载管理
- 安装/卸载确认
- 客户端更新提示

### 第二阶段

再覆盖业务页：

- 应用详情
- 搜索页
- 我的应用
- 更新页
- 自定义分类页

### 第三阶段

处理远端应用元数据的多语言与缓存维度：

- 请求头携带 `Accept-Language`
- 远端接口若支持 `lang/lan` 参数，统一在 API 层收口
- 列表缓存 key 增加 locale 维度
- `appDisplay.ts` 扩展按 locale 选择展示字段

## Hooks 与消息提示约定

hooks 中的用户可见文案必须走 i18n，不允许继续写死字符串。

原因：

- hooks 才是 `message` / `Modal.confirm` 的主要来源
- 如果只改组件层，会导致英文界面下弹中文提示

建议做法：

- hooks 内优先使用 `useI18n()`
- 组件外辅助函数允许消费 i18n 单例，但要避免引入全局 hack
- 动态插值统一使用 `{{name}}` 形式

## Ant Design 集成

Ant Design locale 不在页面层单独设置，统一在根级 `AppProviders` 接入。

这样可以保证：

- `Empty`
- `Pagination`
- `Modal`
- `DatePicker`

等组件默认文案和界面语言一致。

## Rust 与 `ll-cli` 边界

Rust 侧当前为保证 `ll-cli` 输出可解析，仍强制英文 locale。  
这个约束本次不改，因为它属于“命令解析稳定性”问题，不属于前端界面语言问题。

结论：

- 前端界面语言可自由切换
- Rust 侧命令输出仍保持解析友好的稳定语言
- 用户看到的错误文案尽量在前端按错误码和上下文翻译，不直接依赖原始 stderr

## 风险与约束

### 1. 资源文件与代码迁移不同步

如果代码先引用新 key，但资源文件未补齐，会出现 key 直出。  
因此合并前必须统一扫描新增 key。

### 2. 远端元数据与静态文案混用

如果把应用名称、描述直接放进静态字典，会导致数据过期、维护成本高、缓存难控。  
所以必须坚持“界面文案”和“业务数据”分层。

### 3. hooks 文案遗漏

很多弹窗和提示不在页面文件里，而在 hooks 中。  
迁移时必须把 hooks 作为一等范围处理。

## 实施记录

本次首期落地已覆盖：

- 根级 provider 与语言偏好持久化
- 布局与启动链路
- 设置页
- 部分通用组件
- hooks 内的高频提示文案

后续每新增功能时，需要遵守本文件和 `AGENTS.md` 中的 i18n 约束，避免重新引入散落硬编码。
