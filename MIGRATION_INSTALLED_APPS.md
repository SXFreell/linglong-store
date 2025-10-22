# 已安装应用列表页面重构说明

## 概述
本次重构将旧版Electron商店的"卸载程序"（已安装应用列表）页面迁移到新版Tauri项目中。

## 完成的工作

### 1. Rust后端 (Tauri Commands)

#### 新增文件：
- **`src-tauri/src/services/installed.rs`**
  - 实现了 `get_installed_apps()` 函数：执行 `ll-cli list --json` 命令获取已安装应用
  - 实现了 `get_all_installed_apps()` 函数：执行 `ll-cli list --json --type=all` 命令获取所有应用（含基础服务）
  - 定义了 `InstalledApp` 结构体，包含应用的所有信息（appId, name, version, arch, description, icon等）

#### 修改文件：
- **`src-tauri/src/services/mod.rs`**
  - 添加 `pub mod installed;` 模块声明

- **`src-tauri/src/lib.rs`**
  - 导入 `installed` 模块的类型和函数
  - 添加两个新的Tauri命令：
    - `get_installed_linglong_apps`
    - `get_all_installed_linglong_apps`
  - 在 `invoke_handler` 中注册这两个命令

### 2. 前端类型定义和API

#### 修改文件：
- **`src/apis/types.ts`**
  - 添加 `InstalledApp` 接口定义，与Rust端保持一致
  - 包含 `loading` 和 `occurrenceNumber` 等前端状态字段

- **`src/apis/index.ts`**
  - 导出 `InstalledApp` 类型
  - 添加两个API函数：
    - `getInstalledLinglongApps()`: 调用Tauri命令获取已安装应用
    - `getAllInstalledLinglongApps()`: 调用Tauri命令获取所有应用（含基础服务）

- **`src/apis/apps/index.ts`**
  - 添加 `getAppDetails()` 函数：从后端服务器获取应用详细信息（图标、中文名等）

### 3. 状态管理 (Zustand Store)

#### 新增文件：
- **`src/stores/installedApps.ts`**
  - 创建 `useInstalledAppsStore` store
  - 状态字段：
    - `installedApps`: 已安装应用列表
    - `loading`: 加载状态
    - `error`: 错误信息
  - 核心方法：
    - `fetchInstalledApps()`: 获取已安装应用并更新状态
    - `updateAppDetails()`: 从后端API获取应用详情（图标等）
    - `updateAppLoading()`: 更新单个应用的loading状态
    - `removeApp()`: 移除已卸载的应用
    - `clearApps()`: 清空列表

### 4. UI组件更新

#### 修改文件：
- **`src/components/ApplicationCard/index.tsx`**
  - 添加 TypeScript 接口定义 `CardProps`
  - 支持 `InstalledApp` 类型数据
  - 显示应用的中文名称（`zhName`）优先于英文名
  - 新增版本号显示
  - 支持 `loading` 状态显示
  - 添加 `onOperate` 回调函数
  - 点击卡片跳转到应用详情页面，传递完整应用信息

- **`src/components/ApplicationCard/index.module.scss`**
  - 添加 `.version` 样式类，用于显示版本信息

- **`src/pages/myApps/index.tsx`**
  - 完全重构页面逻辑
  - 使用 `useInstalledAppsStore` 获取应用列表
  - 使用 `useConfigStore` 获取配置（是否显示基础服务）
  - 实现应用合并逻辑：
    - 相同 `appId` 的应用合并显示
    - 显示最新版本
    - 使用 Badge 显示同appId的版本数量
  - 添加版本比较函数 `compareVersions()`
  - 加载状态和错误处理
  - 空状态展示

## 功能特性

### ✅ 已实现
1. **正确展示本地已安装应用列表**
   - 从 `ll-cli list --json` 命令获取数据
   - 显示应用名称（中文名优先）
   - 显示应用图标（从后端API获取）
   - 显示应用描述
   - 显示应用版本

2. **应用合并显示**
   - 同一个appId的多个版本合并为一条
   - 显示最新版本的信息
   - Badge标识显示版本数量（超过1个时）

3. **配置支持**
   - 支持"显示基础服务"配置项
   - 根据配置决定是否显示系统基础服务

4. **状态管理**
   - Loading状态显示
   - 错误处理和提示
   - 空状态展示

5. **路由跳转**
   - 点击应用卡片跳转到详情页
   - 传递完整应用信息到详情页

### 🚧 待实现
1. **卸载功能**
   - 卸载确认对话框
   - 调用 `ll-cli uninstall` 命令
   - 卸载进度显示
   - 卸载成功/失败通知
   - 自动刷新列表

2. **应用详情页**
   - 显示应用的所有版本
   - 每个版本的详细信息
   - 版本级别的卸载操作

## 数据流

```
用户访问页面
    ↓
fetchInstalledApps()
    ↓
Tauri Command: get_installed_linglong_apps
    ↓
Rust: 执行 ll-cli list --json
    ↓
解析JSON，返回 InstalledApp[]
    ↓
Store: 保存到 installedApps
    ↓
updateAppDetails()
    ↓
后端API: /visit/getAppDetails
    ↓
获取图标、中文名等详细信息
    ↓
Store: 更新 installedApps
    ↓
页面: 合并相同appId，显示最新版本
    ↓
用户看到已安装应用列表
```

## 与旧版对比

| 特性 | 旧版(Electron) | 新版(Tauri) |
|------|---------------|-------------|
| 命令执行 | IPC + Node.js | Tauri Command + Rust |
| 状态管理 | Pinia | Zustand |
| UI框架 | Vue 3 + Element Plus | React + Arco Design |
| 类型安全 | TypeScript | TypeScript + Rust |
| 数据格式 | 兼容多版本ll-cli输出 | 仅支持JSON格式 |
| 图标获取 | 从后端API | 从后端API（相同） |

## 测试建议

1. **基本功能测试**
   - 确保页面正常加载
   - 验证应用列表正确显示
   - 检查图标是否正确加载

2. **配置测试**
   - 切换"显示基础服务"配置
   - 验证列表内容变化

3. **边界情况**
   - 无已安装应用时的显示
   - ll-cli命令执行失败时的错误处理
   - 网络请求失败时的降级处理

4. **性能测试**
   - 大量应用（100+）时的渲染性能
   - 多版本合并的正确性

## 下一步计划

1. 实现卸载功能
2. 完善应用详情页面
3. 添加搜索和筛选功能
4. 实现应用启动功能（如果需要）
5. 添加单元测试和集成测试

## 注意事项

- 本实现要求 `ll-cli` 版本支持 `--json` 参数
- 需要确保 `ll-cli` 命令在系统PATH中可访问
- 图标获取依赖于后端服务器的可用性
- 版本比较使用简单的点分版本号比较，可能需要更复杂的语义版本比较
